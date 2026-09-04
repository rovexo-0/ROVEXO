/**
 * ROVEXO Lost Parcel Guarantee — seller max £100, netted against carrier compensation.
 * £100 is NEVER a buyer refund cap.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";
import { computeSellerGuaranteeNetGbp } from "@/lib/resolution-engine/lost-parcel-guarantee-math-v1";
import { canAuthorizeBuyerRefund } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import { createOrderStripeRefund } from "@/lib/stripe/refunds";
import { ensureWallet } from "@/lib/wallet/sales";
import { roundWalletMoney } from "@/lib/wallet/security";

export { computeSellerGuaranteeNetGbp } from "@/lib/resolution-engine/lost-parcel-guarantee-math-v1";

/**
 * After carrier confirms lost:
 * 1) Buyer full eligible refund (not capped at £100)
 * 2) Seller guarantee ≤ £100 net of carrier compensation (idempotent)
 */
export async function settleConfirmedLostParcel(input: {
  orderId: string;
  logicalState: Parameters<typeof canAuthorizeBuyerRefund>[0];
  carrierCompensationGbp?: number | null;
}): Promise<
  | {
      ok: true;
      buyerRefundId: string;
      buyerRefundAmount: number;
      sellerGuaranteeNet: number;
    }
  | { ok: false; error: string }
> {
  if (!canAuthorizeBuyerRefund(input.logicalState)) {
    return { ok: false, error: "CARRIER_CONFIRMED_LOST_REQUIRED" };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, buyer_id, seller_id, item_price, total, seller_context")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  const buyerRefund = await createOrderStripeRefund(order.id, {
    notifySeller: true,
    idempotencyKey: `lost-buyer-refund-${order.id}`,
    // Lost parcel: refund eligible item+shipping; retain Buyer Protection fee.
    reason: "LOST",
  });
  if ("error" in buyerRefund) {
    return { ok: false, error: buyerRefund.error };
  }

  const context = normalizeSellerContext(order.seller_context);
  const { net, carrier, gross } = computeSellerGuaranteeNetGbp({
    orderItemPriceGbp: Number(order.item_price),
    carrierCompensationGbp: input.carrierCompensationGbp,
  });

  const idempotencyKey = `lost-guarantee-${order.id}`;
  const { data: existing } = await admin
    .from("lost_parcel_guarantee_events")
    .select("id, net_amount")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      buyerRefundId: buyerRefund.refundId,
      buyerRefundAmount: buyerRefund.refundedAmount ?? 0,
      sellerGuaranteeNet: Number(existing.net_amount),
    };
  }

  if (net > 0) {
    const wallet = await ensureWallet(order.seller_id, context);
    const nextAvailable = roundWalletMoney(Number(wallet.available_balance) + net);
    const { error: walletError } = await admin
      .from("wallets")
      .update({ available_balance: nextAvailable })
      .eq("id", wallet.id);
    if (walletError) {
      return { ok: false, error: walletError.message };
    }

    await admin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      user_id: order.seller_id,
      order_number: order.order_number,
      product_title: "Lost parcel guarantee",
      amount: net,
      status: "completed",
      type: "refund",
      seller_context: context,
      idempotency_key: idempotencyKey,
      description: `lost_parcel_guarantee:${order.id}|gross:${gross}|carrier:${carrier}`,
    });
  }

  await admin.from("lost_parcel_guarantee_events").insert({
    order_id: order.id,
    seller_id: order.seller_id,
    buyer_id: order.buyer_id,
    seller_context: context,
    guarantee_amount: gross,
    carrier_compensation_amount: carrier,
    net_amount: net,
    status: "completed",
    idempotency_key: idempotencyKey,
    metadata: { buyerRefundId: buyerRefund.refundId },
  });

  return {
    ok: true,
    buyerRefundId: buyerRefund.refundId,
    buyerRefundAmount: buyerRefund.refundedAmount ?? 0,
    sellerGuaranteeNet: net,
  };
}
