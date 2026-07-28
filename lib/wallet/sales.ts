import { createAdminClient } from "@/lib/supabase/admin";
import { processAutomaticSellerPayouts } from "@/lib/stripe/payouts";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { isWalletMoneyEnvReady, MISSING_REQUIRED_SECRET } from "@/lib/wallet/env-validation";
import {
  buildRefundDescription,
  buildRefundIdempotencyKey,
  buildSaleIdempotencyKey,
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
    .select("id")
    .eq("user_id", input.sellerId)
    .eq("order_number", input.orderNumber)
    .eq("type", "sale")
    .maybeSingle();

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
