import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

export async function createOrderStripeRefund(orderId: string): Promise<
  { refundId: string } | { error: string; skipped?: boolean }
> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, stripe_payment_intent_id, stripe_refund_id, total, buyer_id, seller_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { error: "Order not found." };
  }

  if (order.stripe_refund_id) {
    return { refundId: order.stripe_refund_id };
  }

  if (!order.stripe_payment_intent_id) {
    if (!isStripeConfigured()) {
      return { refundId: `dev-refund-${orderId}`, skipped: true };
    }
    return { error: "No payment intent found for this order." };
  }

  if (!isStripeConfigured()) {
    return { refundId: `dev-refund-${orderId}`, skipped: true };
  }

  const stripe = getStripeClient();
  const refund = await stripe.refunds.create(
    {
      payment_intent: order.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: { orderId, orderNumber: order.order_number },
    },
    { idempotencyKey: `order-refund-${orderId}` },
  );

  await admin
    .from("orders")
    .update({
      stripe_refund_id: refund.id,
      refunded_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .is("stripe_refund_id", null);

  return { refundId: refund.id };
}
