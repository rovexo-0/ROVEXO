import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { isWalletMoneyEnvReady, MISSING_REQUIRED_SECRET } from "@/lib/wallet/env-validation";
import {
  buildBuyerCheckoutDebitDescription,
  buildBuyerCheckoutDebitIdempotencyKey,
  buildBuyerRefundDescription,
  buildBuyerRefundIdempotencyKey,
  buildRefundDescription,
  buildRefundIdempotencyKey,
  buildSaleIdempotencyKey,
  canDebitAvailable,
  isRovexoWalletRefundCreditEligible,
  remainingAfterWalletCheckoutDebit,
  roundWalletMoney,
} from "@/lib/wallet/security";

import { INDIVIDUAL_PROTECTION_HOURS } from "@/lib/commerce-engine/escrow-constants";
import {
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

/** @deprecated Use INDIVIDUAL_PROTECTION_HOURS / protectionHoursForSellerContext (48h / 14d). */
export const PENDING_HOLD_HOURS = INDIVIDUAL_PROTECTION_HOURS;

/**
 * Single platform fee model: the seller receives the full item price. The only
 * fee on the platform is the buyer-paid Platform Fee (5.5%), returned here as
 * `platformFee` for order-level revenue reporting — it is never deducted from
 * the seller.
 */
export function calculateSellerNetAmount(itemPrice: number): {
  platformFee: number;
  sellerAmount: number;
} {
  const platformFee = calculatePlatformFee(itemPrice);
  const sellerAmount = roundWalletMoney(itemPrice);
  return { platformFee, sellerAmount };
}

export async function ensureWallet(
  userId: string,
  sellerContext: SellerContext = "individual",
) {
  const context = normalizeSellerContext(sellerContext);
  const admin = createAdminClient();
  let { data: wallet } = await admin
    .from("wallets")
    .select("id, pending_balance, available_balance, locked_balance, wallet_context")
    .eq("user_id", userId)
    .eq("wallet_context", context)
    .maybeSingle();

  /* Back-compat: pre-migration rows may lack wallet_context filter match. */
  if (!wallet && context === "individual") {
    const legacy = await admin
      .from("wallets")
      .select("id, pending_balance, available_balance, locked_balance, wallet_context")
      .eq("user_id", userId)
      .maybeSingle();
    wallet = legacy.data;
  }

  if (!wallet) {
    const { data: created, error: createError } = await admin
      .from("wallets")
      .insert({ user_id: userId, wallet_context: context })
      .select("id, pending_balance, available_balance, locked_balance, wallet_context")
      .single();
    if (createError) {
      /* Race: unique (user_id, wallet_context) — re-select */
      const again = await admin
        .from("wallets")
        .select("id, pending_balance, available_balance, locked_balance, wallet_context")
        .eq("user_id", userId)
        .eq("wallet_context", context)
        .maybeSingle();
      if (again.data) return again.data;
      throw new Error(createError.message || "Seller wallet create failed");
    }
    wallet = created;
  }

  return wallet;
}

/**
 * P0-C — Release Pending sale funds to Available (NO Stripe Transfer).
 * Idempotent: already non-pending sale with no transfer required returns success.
 */
export async function releaseSaleToAvailable(input: {
  saleTransactionId: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  sellerContext: SellerContext;
}): Promise<{ success: true } | { success: false; error: string; retryable: boolean }> {
  if (!isWalletMoneyEnvReady("sale_payout")) {
    return { success: false, error: MISSING_REQUIRED_SECRET, retryable: false };
  }
  const admin = createAdminClient();
  const context = normalizeSellerContext(input.sellerContext);
  const amount = roundWalletMoney(input.amount);
  if (!(amount > 0)) {
    return { success: false, error: "Invalid release amount.", retryable: false };
  }

  const { data: saleTx } = await admin
    .from("wallet_transactions")
    .select("id, wallet_id, amount, status, stripe_transfer_id, description")
    .eq("id", input.saleTransactionId)
    .maybeSingle();

  if (!saleTx) {
    return { success: false, error: "Sale transaction not found.", retryable: false };
  }
  if (saleTx.status === "refunded") {
    return { success: false, error: "sale_refunded", retryable: false };
  }
  /* Already released to Available (canonical) or legacy-transferred */
  if (saleTx.status === "completed") {
    return { success: true };
  }
  if (saleTx.stripe_transfer_id) {
    return { success: true };
  }

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, pending_balance, available_balance")
    .eq("id", saleTx.wallet_id)
    .maybeSingle();

  if (!wallet) {
    return { success: false, error: "Wallet not found.", retryable: false };
  }

  const sellerAmount = roundWalletMoney(Number(saleTx.amount));
  const nextPending = Math.max(0, roundWalletMoney(Number(wallet.pending_balance) - sellerAmount));
  const nextAvailable = roundWalletMoney(Number(wallet.available_balance) + sellerAmount);

  const { data: moved, error: walletError } = await admin
    .from("wallets")
    .update({
      pending_balance: nextPending,
      available_balance: nextAvailable,
    })
    .eq("id", wallet.id)
    .gte("pending_balance", sellerAmount)
    .select("id");

  if (walletError || !moved?.length) {
    return { success: false, error: "Unable to move funds to available.", retryable: true };
  }

  const { error: txError } = await admin
    .from("wallet_transactions")
    .update({
      status: "completed",
      seller_context: context,
      description: `order:${input.orderId}|released_available`,
    } as never)
    .eq("id", input.saleTransactionId)
    .eq("status", "pending")
    .is("stripe_transfer_id", null);

  if (txError) {
    await admin
      .from("wallets")
      .update({
        pending_balance: Number(wallet.pending_balance),
        available_balance: Number(wallet.available_balance),
      })
      .eq("id", wallet.id);
    return { success: false, error: "Unable to record release.", retryable: true };
  }

  return { success: true };
}

export async function creditSellerForOrder(input: {
  orderId: string;
  orderNumber: string;
  sellerId: string;
  productTitle: string;
  productImageUrl: string;
  itemPrice: number;
  stripePaymentIntentId?: string | null;
  sellerContext?: SellerContext | string | null;
}): Promise<void> {
  if (!isWalletMoneyEnvReady("sale_payout")) {
    throw new Error(MISSING_REQUIRED_SECRET);
  }
  const admin = createAdminClient();
  const context = normalizeSellerContext(input.sellerContext);
  const saleKey = buildSaleIdempotencyKey(input.orderNumber, input.sellerId);

  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("id, status")
    .eq("user_id", input.sellerId)
    .eq("order_number", input.orderNumber)
    .eq("type", "sale")
    .maybeSingle();

  if (existing?.status === "refunded") {
    return;
  }
  if (existing) {
    return;
  }

  const wallet = await ensureWallet(input.sellerId, context);
  if (!wallet) {
    throw new Error(`Seller wallet unavailable for user ${input.sellerId}.`);
  }

  const { sellerAmount } = calculateSellerNetAmount(input.itemPrice);
  const payoutAvailableAt: string | null = null;
  const nextPending = roundWalletMoney(Number(wallet.pending_balance) + sellerAmount);

  const { data: credited, error: creditError } = await admin
    .from("wallets")
    .update({
      pending_balance: nextPending,
      ...(payoutAvailableAt ? { pending_available_at: payoutAvailableAt } : {}),
    })
    .eq("id", wallet.id)
    .select("id");

  if (creditError || !credited?.length) {
    throw new Error(`Failed to credit pending balance for order ${input.orderNumber}.`);
  }

  const piSuffix = input.stripePaymentIntentId ? `|pi:${input.stripePaymentIntentId}` : "";

  const baseRow = {
    wallet_id: wallet.id,
    user_id: input.sellerId,
    order_number: input.orderNumber,
    product_title: input.productTitle,
    product_image_url: input.productImageUrl,
    amount: sellerAmount,
    fee_amount: 0,
    status: "pending" as const,
    type: "sale" as const,
    seller_context: context,
    payout_available_at: payoutAvailableAt,
    description: `order:${input.orderId}${piSuffix}`,
  };

  let { error: insertError } = await admin.from("wallet_transactions").insert({
    ...baseRow,
    idempotency_key: saleKey,
  } as never);

  // Schema lag: migration 20260719120000 not applied — still credit with app-level idempotency.
  if (insertError && /idempotency_key/i.test(insertError.message)) {
    ({ error: insertError } = await admin.from("wallet_transactions").insert(baseRow as never));
  }

  if (insertError) {
    // Unique race: another writer won — roll back our pending credit.
    if (insertError.code === "23505") {
      await admin
        .from("wallets")
        .update({
          pending_balance: roundWalletMoney(Number(wallet.pending_balance)),
        })
        .eq("id", wallet.id);
      return;
    }
    await admin
      .from("wallets")
      .update({
        pending_balance: roundWalletMoney(Number(wallet.pending_balance)),
      })
      .eq("id", wallet.id);
    throw new Error(insertError.message || "Failed to record sale transaction");
  }
}

/**
 * Canonical Release worker entry (legacy name preserved).
 * Release → Available only. Never creates a sale Connect Transfer.
 * Cron uses CommerceEngine.releaseEligiblePendingBalances (same settlement path).
 */
export async function releaseSellerPendingBalances(): Promise<number> {
  const { releaseEligibleOrders } = await import("@/lib/commerce-engine/settlement");
  return releaseEligibleOrders();
}

/**
 * Idempotent seller refund. Safe failure if post-Connect reversal cannot complete.
 */
export async function refundSellerForOrder(orderId: string, sellerId: string): Promise<void> {
  if (!isWalletMoneyEnvReady("refund")) {
    // Fail closed — never debit / reverse / ledger without required secrets.
    return;
  }

  const admin = createAdminClient();
  const refundKey = buildRefundIdempotencyKey(orderId, sellerId);
  const refundDescription = buildRefundDescription(orderId);

  const { data: existingRefund } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", sellerId)
    .eq("type", "refund")
    .eq("description", refundDescription)
    .maybeSingle();

  if (existingRefund) {
    return;
  }

  const { data: byIdem } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("idempotency_key", refundKey)
    .maybeSingle();

  if (byIdem) {
    return;
  }

  const { data: order } = await admin
    .from("orders")
    .select("order_number, item_price, seller_context")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return;
  }

  const sellerContext = normalizeSellerContext(order.seller_context);

  const { data: saleTx } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", sellerId)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .eq("seller_context", sellerContext)
    .maybeSingle();

  if (saleTx?.status === "refunded") {
    return;
  }

  if (!saleTx) {
    /* Legacy sale rows may omit seller_context — Individual only fallback. */
    if (sellerContext !== "individual") {
      return;
    }
    const { data: legacySale } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", sellerId)
      .eq("order_number", order.order_number)
      .eq("type", "sale")
      .maybeSingle();
    if (!legacySale || legacySale.status === "refunded") {
      return;
    }
    await clawbackSellerSale({
      admin,
      orderId,
      sellerId,
      orderNumber: order.order_number,
      itemPrice: Number(order.item_price),
      saleTx: legacySale,
      sellerContext,
      refundKey,
      refundDescription,
    });
    return;
  }

  await clawbackSellerSale({
    admin,
    orderId,
    sellerId,
    orderNumber: order.order_number,
    itemPrice: Number(order.item_price),
    saleTx,
    sellerContext,
    refundKey,
    refundDescription,
  });
}

async function clawbackSellerSale(input: {
  admin: ReturnType<typeof createAdminClient>;
  orderId: string;
  sellerId: string;
  orderNumber: string;
  itemPrice: number;
  saleTx: {
    id: string;
    status: string;
    stripe_transfer_id: string | null;
  };
  sellerContext: SellerContext;
  refundKey: string;
  refundDescription: string;
}): Promise<void> {
  const { admin, orderId, sellerId, saleTx, sellerContext, refundKey, refundDescription } = input;
  const { sellerAmount } = calculateSellerNetAmount(input.itemPrice);
  const wallet = await ensureWallet(sellerId, sellerContext);
  if (!wallet) {
    return;
  }

  if (saleTx?.status === "pending" && !saleTx.stripe_transfer_id) {
    const { data: debited } = await admin
      .from("wallets")
      .update({
        pending_balance: roundWalletMoney(Number(wallet.pending_balance) - sellerAmount),
      })
      .eq("id", wallet.id)
      .gte("pending_balance", sellerAmount)
      .select("id");

    if (!debited?.length) {
      // Uncertain → do not invent money movement.
      return;
    }
  } else if (saleTx?.status === "completed" && saleTx.stripe_transfer_id) {
    if (!isStripeConfigured()) {
      // Safe failure: lock — do not mark refunded or insert ledger without clawback path.
      return;
    }
    try {
      const stripe = getStripeClient();
      await stripe.transfers.createReversal(
        saleTx.stripe_transfer_id,
        { amount: Math.round(sellerAmount * 100) },
        { idempotencyKey: `order-refund-reversal-${orderId}` },
      );
    } catch {
      // Keep sale as-is; wait for retry / webhook. Never double-ledger.
      return;
    }
  } else if (saleTx?.status === "completed") {
    const { data: debited } = await admin
      .from("wallets")
      .update({
        available_balance: roundWalletMoney(Number(wallet.available_balance) - sellerAmount),
      })
      .eq("id", wallet.id)
      .gte("available_balance", sellerAmount)
      .select("id");

    if (!debited?.length) {
      return;
    }
  }

  if (saleTx) {
    await admin.from("wallet_transactions").update({ status: "refunded" }).eq("id", saleTx.id);
  }

  const refundRow = {
    wallet_id: wallet.id,
    user_id: sellerId,
    order_number: input.orderNumber,
    product_title: `Refund — ${input.orderNumber}`,
    amount: -sellerAmount,
    status: "completed" as const,
    type: "refund" as const,
    description: refundDescription,
    seller_context: sellerContext,
  };

  let { error: insertError } = await admin.from("wallet_transactions").insert({
    ...refundRow,
    idempotency_key: refundKey,
  });

  if (insertError && /idempotency_key/i.test(insertError.message)) {
    ({ error: insertError } = await admin.from("wallet_transactions").insert(refundRow));
  }

  if (insertError?.code === "23505") {
    return;
  }
}

export type CreditBuyerWalletForConfirmedRefundInput = {
  orderId: string;
  buyerId: string;
  refundId: string;
  amount: number;
  orderNumber: string;
  productTitle?: string;
  productImageUrl?: string;
  paymentMethod?: string | null;
  paymentId?: string | null;
};

/**
 * Credit the buyer's existing wallet ledger after a confirmed ROVEXO wallet-credit refund.
 * Never credits for Stripe card refunds (`re_*`). Duplicate refundId / order = one credit.
 */
export async function creditBuyerWalletForConfirmedRefund(
  input: CreditBuyerWalletForConfirmedRefundInput,
): Promise<void> {
  if (!isRovexoWalletRefundCreditEligible({
    refundId: input.refundId,
    paymentMethod: input.paymentMethod,
  })) {
    return;
  }

  const amount = roundWalletMoney(input.amount);
  if (!(amount > 0)) {
    return;
  }

  if (!isWalletMoneyEnvReady("refund")) {
    return;
  }

  const admin = createAdminClient();
  const refundKey = buildBuyerRefundIdempotencyKey(input.refundId);
  const refundDescription = buildBuyerRefundDescription(input.orderId, input.refundId);

  const { data: byIdem } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("idempotency_key", refundKey)
    .maybeSingle();
  if (byIdem) {
    return;
  }

  const wallet = await ensureWallet(input.buyerId);
  if (!wallet) {
    return;
  }

  const previousAvailable = roundWalletMoney(Number(wallet.available_balance));
  const nextAvailable = roundWalletMoney(previousAvailable + amount);

  const { data: credited, error: creditError } = await admin
    .from("wallets")
    .update({ available_balance: nextAvailable })
    .eq("id", wallet.id)
    .eq("user_id", input.buyerId)
    .eq("available_balance", previousAvailable)
    .select("id");

  if (creditError || !credited?.length) {
    return;
  }

  const paymentSuffix = input.paymentId ? `|payment:${input.paymentId}` : "";
  const refundRow = {
    wallet_id: wallet.id,
    user_id: input.buyerId,
    order_number: input.orderNumber,
    product_title: input.productTitle?.trim() || `Refund — ${input.orderNumber}`,
    product_image_url: input.productImageUrl ?? "",
    amount,
    status: "completed" as const,
    type: "refund" as const,
    description: `${refundDescription}${paymentSuffix}`,
  };

  let { error: insertError } = await admin.from("wallet_transactions").insert({
    ...refundRow,
    idempotency_key: refundKey,
  });

  if (insertError && /idempotency_key/i.test(insertError.message)) {
    ({ error: insertError } = await admin.from("wallet_transactions").insert(refundRow));
  }

  if (insertError) {
    await admin
      .from("wallets")
      .update({ available_balance: previousAvailable })
      .eq("id", wallet.id)
      .eq("user_id", input.buyerId);
  }
}

export type DebitBuyerWalletForCheckoutInput = {
  buyerId: string;
  /** Locked checkout payable total — never recalculated here. */
  amount: number;
  orderId: string;
  orderNumber: string;
  productTitle: string;
  checkoutSessionPublicId: string;
};

export type DebitBuyerWalletForCheckoutResult =
  | {
      ok: true;
      sessionId: string;
      remainingBalance: number;
      alreadyDebited: boolean;
    }
  | { ok: false; error: string };

/**
 * Production ROVEXO Balance debit for Confirm & Pay.
 * Debits the locked payable total only. No Stripe. No Full Demo seed.
 */
/**
 * Buyer Checkout always debits the Personal (individual) ROVEXO Wallet.
 * Never seller Stripe Connect. Never Business Wallet.
 * seller_context on the ledger stamp is individual = buyer wallet ownership.
 */
async function loadBuyerCheckoutWallet(buyerId: string): Promise<{
  id: string;
  available_balance: number;
} | null> {
  const admin = createAdminClient();
  let { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance, wallet_context")
    .eq("user_id", buyerId)
    .eq("wallet_context", "individual")
    .maybeSingle();

  if (!wallet) {
    const legacy = await admin
      .from("wallets")
      .select("id, available_balance, wallet_context")
      .eq("user_id", buyerId)
      .maybeSingle();
    if (
      legacy.data &&
      (legacy.data.wallet_context == null ||
        legacy.data.wallet_context === "" ||
        legacy.data.wallet_context === "individual")
    ) {
      wallet = legacy.data;
    }
  }

  return wallet
    ? { id: wallet.id, available_balance: Number(wallet.available_balance ?? 0) }
    : null;
}

export async function readBuyerWalletCheckoutEligibility(input: {
  buyerId: string;
  amount: number;
}): Promise<
  | { ok: true; available: number; remaining: number }
  | { ok: false; error: string }
> {
  const amount = roundWalletMoney(input.amount);
  if (!(amount > 0)) {
    return { ok: false, error: "Invalid wallet payment amount." };
  }

  const wallet = await loadBuyerCheckoutWallet(input.buyerId);
  const available = roundWalletMoney(Number(wallet?.available_balance ?? 0));
  const remaining = remainingAfterWalletCheckoutDebit(available, amount);
  if (remaining === null || !canDebitAvailable(available, amount)) {
    return { ok: false, error: "Insufficient wallet balance." };
  }

  return { ok: true, available, remaining };
}

export async function debitBuyerWalletForCheckout(
  input: DebitBuyerWalletForCheckoutInput,
): Promise<DebitBuyerWalletForCheckoutResult> {
  const amount = roundWalletMoney(input.amount);
  if (!(amount > 0)) {
    return { ok: false, error: "Invalid wallet payment amount." };
  }

  const checkoutSessionPublicId = input.checkoutSessionPublicId.trim();
  if (!checkoutSessionPublicId) {
    return { ok: false, error: "Checkout session required." };
  }

  const admin = createAdminClient();
  const idempotencyKey = buildBuyerCheckoutDebitIdempotencyKey(checkoutSessionPublicId);
  const sessionId = `wallet_pay_${input.orderId}`;

  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("id, amount, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    const existingAmount = roundWalletMoney(Math.abs(Number(existing.amount)));
    if (existing.status === "completed" && existingAmount === amount) {
      const wallet = await loadBuyerCheckoutWallet(input.buyerId);
      return {
        ok: true,
        sessionId,
        remainingBalance: roundWalletMoney(Number(wallet?.available_balance ?? 0)),
        alreadyDebited: true,
      };
    }
    return { ok: false, error: "Duplicate wallet payment could not be verified." };
  }

  const eligible = await readBuyerWalletCheckoutEligibility({
    buyerId: input.buyerId,
    amount,
  });
  if (!eligible.ok) {
    return eligible;
  }

  const wallet = await loadBuyerCheckoutWallet(input.buyerId);
  if (!wallet) {
    return { ok: false, error: "Insufficient wallet balance." };
  }

  const previousAvailable = roundWalletMoney(Number(wallet.available_balance));
  const nextAvailable = remainingAfterWalletCheckoutDebit(previousAvailable, amount);
  if (nextAvailable === null) {
    return { ok: false, error: "Insufficient wallet balance." };
  }

  const { data: debited, error: debitError } = await admin
    .from("wallets")
    .update({ available_balance: nextAvailable })
    .eq("id", wallet.id)
    .eq("user_id", input.buyerId)
    .eq("available_balance", previousAvailable)
    .gte("available_balance", amount)
    .select("id");

  if (debitError || !debited?.length) {
    return { ok: false, error: "Insufficient wallet balance." };
  }

  const description = buildBuyerCheckoutDebitDescription({
    orderNumber: input.orderNumber,
    sessionId,
  });

  const { error: insertError } = await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: input.buyerId,
    order_number: input.orderNumber,
    product_title: input.productTitle,
    amount: -amount,
    status: "completed",
    type: "fee",
    seller_context: "individual",
    idempotency_key: idempotencyKey,
    description,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced } = await admin
        .from("wallet_transactions")
        .select("id, amount, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      const racedAmount = roundWalletMoney(Math.abs(Number(raced?.amount)));
      if (raced?.status === "completed" && racedAmount === amount) {
        await admin
          .from("wallets")
          .update({ available_balance: previousAvailable })
          .eq("id", wallet.id)
          .eq("user_id", input.buyerId);
        return {
          ok: true,
          sessionId,
          remainingBalance: previousAvailable === amount
            ? nextAvailable
            : roundWalletMoney(previousAvailable - amount),
          alreadyDebited: true,
        };
      }
    }

    await admin
      .from("wallets")
      .update({ available_balance: previousAvailable })
      .eq("id", wallet.id)
      .eq("user_id", input.buyerId);
    return { ok: false, error: "Unable to record wallet payment." };
  }

  return {
    ok: true,
    sessionId,
    remainingBalance: nextAvailable,
    alreadyDebited: false,
  };
}

export async function reverseBuyerWalletCheckoutDebit(input: {
  buyerId: string;
  checkoutSessionPublicId: string;
}): Promise<void> {
  const checkoutSessionPublicId = input.checkoutSessionPublicId.trim();
  if (!checkoutSessionPublicId) return;

  const admin = createAdminClient();
  const idempotencyKey = buildBuyerCheckoutDebitIdempotencyKey(checkoutSessionPublicId);
  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("id, amount, wallet_id, status")
    .eq("idempotency_key", idempotencyKey)
    .eq("user_id", input.buyerId)
    .maybeSingle();

  if (!existing || existing.status !== "completed") return;

  const restore = roundWalletMoney(Math.abs(Number(existing.amount)));
  if (!(restore > 0)) return;

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("id", existing.wallet_id)
    .eq("user_id", input.buyerId)
    .maybeSingle();

  if (!wallet) return;

  const previousAvailable = roundWalletMoney(Number(wallet.available_balance));
  await admin
    .from("wallets")
    .update({ available_balance: roundWalletMoney(previousAvailable + restore) })
    .eq("id", wallet.id)
    .eq("user_id", input.buyerId)
    .eq("available_balance", previousAvailable);

  await admin
    .from("wallet_transactions")
    .update({ status: "failed" })
    .eq("id", existing.id)
    .eq("user_id", input.buyerId);
}
