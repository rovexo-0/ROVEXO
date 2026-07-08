import { createAdminClient } from "@/lib/supabase/admin";
import { applyListingPromotion } from "@/lib/promotions/service";
import type { PromotionType } from "@/lib/promotions/config";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { createOrderStripeRefund } from "@/lib/stripe/refunds";
import { releaseProductInventory } from "@/lib/inventory/service";
import { notifyOrderRefunded } from "@/lib/orders/notifications";
import { onOrderRefunded } from "@/lib/trust/events";
import { CommerceEngine } from "@/lib/commerce-engine";

export async function grantPromotion(input: {
  actorId: string;
  sellerId: string;
  productId: string;
  type: PromotionType;
  durationId?: string;
}): Promise<void> {
  const durationId = input.durationId ?? (input.type === "bump" ? "24h" : "7d");
  await applyListingPromotion({
    sellerId: input.sellerId,
    productId: input.productId,
    type: input.type,
    durationId,
    amountCents: 0,
    stripeSessionId: null,
    stripePaymentIntentId: null,
  });

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "grants.promotion",
    resourceType: "listing_promotion",
    resourceId: input.productId,
    metadata: { sellerId: input.sellerId, type: input.type, durationId },
  });
}

export async function adjustWalletBalance(input: {
  actorId: string;
  userId: string;
  amount: number;
  description: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!wallet) {
    throw new Error("Wallet not found.");
  }

  const nextBalance = Number(wallet.available_balance) + input.amount;
  if (nextBalance < 0) {
    throw new Error("Wallet balance cannot go below zero.");
  }

  await admin.from("wallets").update({ available_balance: nextBalance }).eq("id", wallet.id);
  await admin.from("wallet_transactions").insert({
    user_id: input.userId,
    wallet_id: wallet.id,
    type: input.amount >= 0 ? "sale" : "fee",
    status: "completed",
    amount: input.amount,
    description: input.description,
    product_title: "Super Admin adjustment",
    product_image_url: null,
  });

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "grants.wallet_adjustment",
    resourceType: "wallet",
    resourceId: wallet.id,
    metadata: { amount: input.amount, description: input.description },
  });
}

export async function grantPromotionCredits(input: {
  actorId: string;
  userId: string;
  credits: number;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profile_entitlements")
    .select("promotion_credits")
    .eq("user_id", input.userId)
    .maybeSingle();

  const nextCredits = Number(existing?.promotion_credits ?? 0) + input.credits;
  await admin.from("profile_entitlements").upsert(
    {
      user_id: input.userId,
      promotion_credits: nextCredits,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "grants.promotion_credits",
    resourceType: "profile_entitlements",
    resourceId: input.userId,
    metadata: { credits: input.credits, total: nextCredits },
  });
}

export async function refundOrderPayment(input: {
  actorId: string;
  orderId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, total, buyer_id, seller_id, stripe_refund_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.stripe_refund_id) {
    throw new Error("Order already refunded.");
  }

  if (!["awaiting_shipment", "shipped", "delivered", "completed"].includes(order.status)) {
    throw new Error("Order cannot be refunded in its current status.");
  }

  const { data: orderRow } = await admin
    .from("orders")
    .select("order_items(product_id, quantity), stripe_refund_id, total")
    .eq("id", input.orderId)
    .maybeSingle();

  const refundResult = await createOrderStripeRefund(input.orderId);
  if ("error" in refundResult) {
    throw new Error(refundResult.error);
  }

  const item = (orderRow?.order_items as Array<{ product_id: string | null; quantity: number }> | null)?.[0];
  if (item?.product_id) {
    await releaseProductInventory(item.product_id, item.quantity ?? 1);
  }

  await CommerceEngine.refundSeller({
    orderId: input.orderId,
    sellerId: order.seller_id,
    buyerId: order.buyer_id,
    refundType: "full",
    amount: Number(orderRow?.total ?? order.total),
    reason: "admin_refund",
    actorId: input.actorId,
  });

  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", order.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", order.seller_id).maybeSingle(),
  ]);

  await notifyOrderRefunded({
    buyerId: order.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    sellerId: order.seller_id,
    sellerEmail: sellerProfile?.email ?? "",
    orderNumber: order.order_number,
    amount: Number(orderRow?.total ?? order.total),
  });

  void onOrderRefunded({
    orderId: input.orderId,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
  });

  await admin.from("orders").update({ status: "cancelled" }).eq("id", input.orderId);

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "grants.refund_payment",
    resourceType: "order",
    resourceId: input.orderId,
    metadata: { orderNumber: order.order_number, amount: Number(order.total) },
  });
}
