import { createAdminClient } from "@/lib/supabase/admin";
import { processAutomaticSellerPayouts } from "@/lib/stripe/payouts";
import { calculatePlatformFee } from "@/lib/orders/pricing";

export const PENDING_HOLD_HOURS = 36;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

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
  const sellerAmount = roundMoney(itemPrice);
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
    const { data: created } = await admin
      .from("wallets")
      .insert({ user_id: userId })
      .select("id, pending_balance, available_balance")
      .single();
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
  const admin = createAdminClient();
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
  // Release timer is set by Commerce Engine when the order is delivered (+24h).
  // Until then, settlement gates block payout regardless of this column.
  const payoutAvailableAt: string | null = null;

  await admin
    .from("wallets")
    .update({
      pending_balance: roundMoney(Number(wallet.pending_balance) + sellerAmount),
      ...(payoutAvailableAt ? { pending_available_at: payoutAvailableAt } : {}),
    })
    .eq("id", wallet.id);

  const piSuffix = input.stripePaymentIntentId ? `|pi:${input.stripePaymentIntentId}` : "";

  await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: input.sellerId,
    order_number: input.orderNumber,
    product_title: input.productTitle,
    product_image_url: input.productImageUrl,
    amount: sellerAmount,
    fee_amount: 0,
    status: "pending",
    type: "sale",
    payout_available_at: payoutAvailableAt,
    description: `order:${input.orderId}${piSuffix}`,
  });
}

/**
 * Runs automatic Connect transfers for sales past the hold period, then returns the count transferred.
 * Preserves the legacy function name used by cron maintenance.
 */
export async function releaseSellerPendingBalances(): Promise<number> {
  return processAutomaticSellerPayouts();
}

export async function refundSellerForOrder(orderId: string, sellerId: string): Promise<void> {
  const admin = createAdminClient();
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

  const { sellerAmount } = calculateSellerNetAmount(Number(order.item_price));
  const wallet = await ensureWallet(sellerId);
  if (!wallet) {
    return;
  }

  if (saleTx?.status === "pending" && !saleTx.stripe_transfer_id) {
    await admin
      .from("wallets")
      .update({
        pending_balance: Math.max(0, roundMoney(Number(wallet.pending_balance) - sellerAmount)),
      })
      .eq("id", wallet.id);
  } else if (saleTx?.status === "completed" && saleTx.stripe_transfer_id) {
    // Transfer already sent to Connect; ledger refund entry only (Stripe reversal handled separately).
  } else if (saleTx?.status === "completed") {
    await admin
      .from("wallets")
      .update({
        available_balance: Math.max(0, roundMoney(Number(wallet.available_balance) - sellerAmount)),
      })
      .eq("id", wallet.id);
  }

  if (saleTx) {
    await admin
      .from("wallet_transactions")
      .update({ status: "refunded" })
      .eq("id", saleTx.id);
  }

  await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: sellerId,
    order_number: order.order_number,
    product_title: `Refund — ${order.order_number}`,
    amount: -sellerAmount,
    status: "completed",
    type: "refund",
    description: `order:${orderId}`,
  });
}
