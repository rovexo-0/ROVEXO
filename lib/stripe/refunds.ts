import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { applyOrderRefundLifecycle } from "@/lib/orders/refund-lifecycle.server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";
import { ROVEXO_WALLET_REFUND_METHOD } from "@/lib/wallet/security";

const ZERO_CAPTURE_ERROR = "No captured payment to refund.";
const CAPTURE_UNVERIFIED_ERROR = "Unable to verify captured payment.";

function isVirtualPaymentIntentId(paymentIntentId: string | null | undefined): boolean {
  if (!paymentIntentId) return false;
  return (
    paymentIntentId.startsWith("pi_virtual_") ||
    paymentIntentId.startsWith("pi_dev_") ||
    paymentIntentId.startsWith("demo_pay_") ||
    paymentIntentId.startsWith("virtual_")
  );
}

function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

function fromPence(pence: number): number {
  return Math.round(pence) / 100;
}

function refundableGbp(orderTotalGbp: number, capturedPence: number): number {
  const orderTotalPence = toPence(orderTotalGbp);
  const refundablePence = Math.min(orderTotalPence, Math.max(0, Math.round(capturedPence)));
  return fromPence(refundablePence);
}

function readChargeAmountCapturedPence(charge: unknown): number | null {
  if (!charge || typeof charge !== "object") {
    return null;
  }
  if ("deleted" in charge && (charge as { deleted?: boolean }).deleted) {
    return null;
  }
  const captured = (charge as { amount_captured?: unknown }).amount_captured;
  if (typeof captured !== "number" || !Number.isFinite(captured)) {
    return null;
  }
  return Math.round(captured);
}

/**
 * Authoritative live capture: Charge.amount_captured (pence).
 * Fail closed when the charge cannot be read. Never treat PI existence as capture.
 */
async function retrieveLiveCapturedAmountPence(
  paymentIntentId: string,
): Promise<{ ok: true; amountPence: number } | { ok: false }> {
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const latestCharge = paymentIntent.latest_charge;
    const expanded = readChargeAmountCapturedPence(latestCharge);
    if (expanded !== null) {
      return { ok: true, amountPence: expanded };
    }
    if (typeof latestCharge === "string" && latestCharge) {
      const charge = await stripe.charges.retrieve(latestCharge);
      const captured = readChargeAmountCapturedPence(charge);
      if (captured !== null) {
        return { ok: true, amountPence: captured };
      }
    }
    return { ok: false };
  } catch {
    console.error("[stripe/refunds] capture lookup failed", {
      paymentIntentId,
    });
    return { ok: false };
  }
}

function isVirtualBuyerDebitRow(row: {
  amount?: unknown;
  type?: unknown;
  description?: unknown;
}): boolean {
  if (row.type !== "fee") return false;
  const description = typeof row.description === "string" ? row.description : "";
  if (!description.startsWith("Virtual payment for order ")) return false;
  const amount = Number(row.amount);
  return Number.isFinite(amount) && amount < 0;
}

/**
 * Virtual capture-equivalent: successful debitVirtualBuyerWallet ledger row.
 * Order paid timestamp / virtual PI id are not proof of debit.
 */
async function retrieveVirtualCapturedAmountPence(input: {
  buyerId: string;
  orderNumber: string;
}): Promise<{ ok: true; amountPence: number } | { ok: false }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wallet_transactions")
      .select("amount, type, description, order_number")
      .eq("user_id", input.buyerId)
      .eq("order_number", input.orderNumber)
      .eq("type", "fee");

    if (error) {
      return { ok: false };
    }

    const capturedPence = (data ?? []).reduce((sum, row) => {
      if (!isVirtualBuyerDebitRow(row)) return sum;
      return sum + toPence(Math.abs(Number(row.amount)));
    }, 0);

    return { ok: true, amountPence: capturedPence };
  } catch {
    console.error("[stripe/refunds] virtual debit lookup failed");
    return { ok: false };
  }
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

  const orderTotalGbp = Number(order.total);
  const virtualPi = isVirtualPaymentIntentId(order.stripe_payment_intent_id);
  const virtualPath = virtualPi || mustUseVirtualPayments() || !isStripeConfigured();

  if (virtualPath) {
    const virtualCapture = await retrieveVirtualCapturedAmountPence({
      buyerId: order.buyer_id,
      orderNumber: order.order_number,
    });
    if (!virtualCapture.ok) {
      return { error: CAPTURE_UNVERIFIED_ERROR };
    }
    if (virtualCapture.amountPence <= 0) {
      return { error: ZERO_CAPTURE_ERROR };
    }
    const amount = refundableGbp(orderTotalGbp, virtualCapture.amountPence);
    if (amount <= 0) {
      return { error: ZERO_CAPTURE_ERROR };
    }
    return applyVirtualOrderRefund(orderId, amount, options);
  }

  if (!order.stripe_payment_intent_id) {
    return { error: "No payment intent found for this order." };
  }

  const liveCapture = await retrieveLiveCapturedAmountPence(order.stripe_payment_intent_id);
  if (!liveCapture.ok) {
    return { error: CAPTURE_UNVERIFIED_ERROR };
  }
  if (liveCapture.amountPence <= 0) {
    return { error: ZERO_CAPTURE_ERROR };
  }

  const amount = refundableGbp(orderTotalGbp, liveCapture.amountPence);
  if (amount <= 0) {
    return { error: ZERO_CAPTURE_ERROR };
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
