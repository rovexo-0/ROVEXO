import { createAdminClient } from "@/lib/supabase/admin";
import { processAutomaticSellerPayouts } from "@/lib/stripe/payouts";
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

import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";

/** @deprecated Use DELIVERED_RELEASE_HOURS from commerce-engine/escrow-constants (24h). */
export const PENDING_HOLD_HOURS = DELIVERED_RELEASE_HOURS;

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

async function ensureWallet(userId: string) {
  const admin = createAdminClient();
  let { data: wallet } = await admin
    .from("wallets")
    .select("id, pending_balance, available_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (!wallet) {
    const { data: created, error: createError } = await admin
      .from("wallets")
      .insert({ user_id: userId })
      .select("id, pending_balance, available_balance")
      .single();
    if (createError) {
      throw new Error(createError.message || "Seller wallet create failed");
    }
    wallet = created;
  }

  return wallet;
}

export async function creditSellerForOrder(input: {
  orderId: string;
  orderNumber: string;
  sellerId: string;
  productTitle: string;
  productImageUrl: string;
  itemPrice: number;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  if (!isWalletMoneyEnvReady("sale_payout")) {
    throw new Error(MISSING_REQUIRED_SECRET);
  }
  const admin = createAdminClient();
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

  const wallet = await ensureWallet(input.sellerId);
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
    payout_available_at: payoutAvailableAt,
    description: `order:${input.orderId}${piSuffix}`,
  };

  let { error: insertError } = await admin.from("wallet_transactions").insert({
    ...baseRow,
    idempotency_key: saleKey,
  });

  // Schema lag: migration 20260719120000 not applied — still credit with app-level idempotency.
  if (insertError && /idempotency_key/i.test(insertError.message)) {
    ({ error: insertError } = await admin.from("wallet_transactions").insert(baseRow));
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
 * Runs automatic Connect transfers for sales past the hold period, then returns the count transferred.
 * Preserves the legacy function name used by cron maintenance.
 */
export async function releaseSellerPendingBalances(): Promise<number> {
  return processAutomaticSellerPayouts();
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
    .select("order_number, item_price")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return;
  }

  const { data: saleTx } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", sellerId)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .maybeSingle();

  if (saleTx?.status === "refunded") {
    return;
  }

  if (!saleTx) {
    return;
  }

  const { sellerAmount } = calculateSellerNetAmount(Number(order.item_price));
  const wallet = await ensureWallet(sellerId);
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
    order_number: order.order_number,
    product_title: `Refund — ${order.order_number}`,
    amount: -sellerAmount,
    status: "completed" as const,
    type: "refund" as const,
    description: refundDescription,
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

  const { data: existingRefund } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", input.buyerId)
    .eq("order_number", input.orderNumber)
    .eq("type", "refund")
    .maybeSingle();
  if (existingRefund) {
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

  const admin = createAdminClient();
  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.buyerId)
    .maybeSingle();

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
      const { data: wallet } = await admin
        .from("wallets")
        .select("available_balance")
        .eq("user_id", input.buyerId)
        .maybeSingle();
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

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.buyerId)
    .maybeSingle();

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
