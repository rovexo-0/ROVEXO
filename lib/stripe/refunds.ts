import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { applyOrderRefundLifecycle } from "@/lib/orders/refund-lifecycle.server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";

function isVirtualPaymentIntentId(paymentIntentId: string | null | undefined): boolean {
  if (!paymentIntentId) return false;
  return (
    paymentIntentId.startsWith("pi_virtual_") ||
    paymentIntentId.startsWith("pi_dev_") ||
    paymentIntentId.startsWith("demo_pay_") ||
    paymentIntentId.startsWith("virtual_")
  );
}

async function applyVirtualOrderRefund(
  orderId: string,
  amount: number,
  options?: { notifySeller?: boolean },
): Promise<{ refundId: string; refundedAmount: number; refundedAt?: string; skipped: true }> {
  const admin = createAdminClient();
  const refundId = `virtual-refund-${orderId}`;
  await applyOrderRefundLifecycle({
    orderId,
    refundId,
    amount,
    stripeStatus: "succeeded",
    paymentMethod: "Original payment method",
    notifySeller: options?.notifySeller,
  });
  const { data: updated } = await admin
    .from("orders")
    .select("refund_completed_at")
    .eq("id", orderId)
    .maybeSingle();
  return {
    refundId,
    refundedAmount: amount,
    refundedAt: updated?.refund_completed_at ?? new Date().toISOString(),
    skipped: true,
  };
}

export async function createOrderStripeRefund(
  orderId: string,
  options?: { notifySeller?: boolean },
): Promise<
  | { refundId: string; refundedAmount?: number; refundedAt?: string; skipped?: boolean }
  | { error: string; skipped?: boolean }
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
    return {
      refundId: order.stripe_refund_id,
      refundedAmount: Number(order.total),
      refundedAt: undefined,
    };
  }

  const amount = Number(order.total);
  const virtualPi = isVirtualPaymentIntentId(order.stripe_payment_intent_id);

  if (!order.stripe_payment_intent_id) {
    if (!isStripeConfigured() || mustUseVirtualPayments()) {
      return applyVirtualOrderRefund(orderId, amount, options);
    }
    return { error: "No payment intent found for this order." };
  }

  // Virtual / demo PIs must never hit live Stripe refunds.
  if (virtualPi || mustUseVirtualPayments() || !isStripeConfigured()) {
    return applyVirtualOrderRefund(orderId, amount, options);
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

  const refundedAmount = Math.round(refund.amount) / 100;
  const status = await applyOrderRefundLifecycle({
    orderId,
    refundId: refund.id,
    amount: refundedAmount,
    stripeStatus: refund.status,
    paymentMethod: "Original payment method",
    notifySeller: options?.notifySeller,
  });

  const { data: updated } = await admin
    .from("orders")
    .select("refund_completed_at")
    .eq("id", orderId)
    .maybeSingle();

  return {
    refundId: refund.id,
    refundedAmount,
    refundedAt: status === "completed" ? updated?.refund_completed_at ?? new Date().toISOString() : undefined,
  };
}
