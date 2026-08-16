import { createAdminClient } from "@/lib/supabase/admin";
import { isStripeConfigured } from "@/lib/stripe/server";
import { applyOrderRefundLifecycle } from "@/lib/orders/refund-lifecycle.server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";
import { ROVEXO_WALLET_REFUND_METHOD } from "@/lib/wallet/security";

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
    paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
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

  // ROVEXO wallet-credit path: do NOT create a Stripe card refund.
  // One financial outcome — wallet credit (idempotent) — then existing Withdraw.
  const refundId = `wallet-refund-${orderId}`;
  const status = await applyOrderRefundLifecycle({
    orderId,
    refundId,
    amount,
    stripeStatus: "succeeded",
    paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
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
    refundedAt: status === "completed" ? updated?.refund_completed_at ?? new Date().toISOString() : undefined,
  };
}
