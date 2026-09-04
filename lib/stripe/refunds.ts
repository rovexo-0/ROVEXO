import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { applyOrderRefundLifecycle } from "@/lib/orders/refund-lifecycle.server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";
import { ROVEXO_WALLET_REFUND_METHOD } from "@/lib/wallet/security";
import {
  fromRefundPence,
  isOrderFullyRefunded,
  refundableGbp,
  remainingRefundableGbp,
  resolveRefundIntentAmountGbp,
  toRefundPence,
} from "@/lib/stripe/refund-math-v1";
import {
  policyMaxRefundablePence,
  resolveBuyerProtectionAwareRefundGbp,
  type BuyerProtectionRefundReason,
  buildOrderFinancialBreakdownPence,
} from "@/lib/orders/buyer-protection-refund-v1";

export const ZERO_CAPTURE_ERROR = "No captured payment to refund.";
export const CAPTURE_UNVERIFIED_ERROR = "Unable to verify captured payment.";

export {
  refundableGbp,
  remainingRefundableGbp,
  resolveRefundIntentAmountGbp,
  isOrderFullyRefunded,
} from "@/lib/stripe/refund-math-v1";

export function isZeroCaptureRefundError(error: string | undefined): boolean {
  return error === ZERO_CAPTURE_ERROR;
}

function isVirtualPaymentIntentId(paymentIntentId: string | null | undefined): boolean {
  if (!paymentIntentId) return false;
  return (
    paymentIntentId.startsWith("pi_virtual_") ||
    paymentIntentId.startsWith("pi_dev_") ||
    paymentIntentId.startsWith("demo_pay_") ||
    paymentIntentId.startsWith("virtual_")
  );
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
      return sum + toRefundPence(Math.abs(Number(row.amount)));
    }, 0);

    return { ok: true, amountPence: capturedPence };
  } catch {
    console.error("[stripe/refunds] virtual debit lookup failed");
    return { ok: false };
  }
}

/**
 * Canonical ROVEXO order refund (wallet-credit path).
 * Does NOT call Stripe card Refunds API by default.
 *
 * Buyer Protection (`orders.protected_fee`) is platform-owned and NOT refunded
 * unless `reason === "PLATFORM_ERROR"`. Refund amount is always ROVEXO-calculated
 * — never PaymentIntent.amount automatically.
 *
 * Idempotency:
 * - Eligible amount already refunded → return existing
 * - Same intent retry → lifecycle / wallet keys
 * - Partial: amountGbp required for intentional partial; omit = remaining eligible
 */
export async function createOrderStripeRefund(
  orderId: string,
  options?: {
    notifySeller?: boolean;
    /** Partial refund amount in GBP. Omit for full remaining eligible. */
    amountGbp?: number;
    idempotencyKey?: string | null;
    /**
     * Refund reason controlling Buyer Protection fee eligibility.
     * Default OTHER → fee retained. Only PLATFORM_ERROR may refund the fee.
     */
    reason?: BuyerProtectionRefundReason;
  },
): Promise<
  | { refundId: string; refundedAmount?: number; refundedAt?: string; skipped?: boolean }
  | { error: string; skipped?: boolean }
> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_number, stripe_payment_intent_id, stripe_refund_id, refunded_amount, total, item_price, delivery_fee, protected_fee, buyer_id, seller_id",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { error: "Order not found." };
  }

  const alreadyRefunded = Number(order.refunded_amount ?? 0);
  const orderTotalGbp = Number(order.total);
  const itemPriceGbp = Number(order.item_price ?? 0);
  const deliveryFeeGbp = Number(order.delivery_fee ?? 0);
  const protectedFeeGbp = Number(order.protected_fee ?? 0);
  const reason: BuyerProtectionRefundReason = options?.reason ?? "OTHER";

  const breakdown = buildOrderFinancialBreakdownPence({
    itemPriceGbp,
    deliveryFeeGbp,
    protectedFeeGbp,
    totalGbp: orderTotalGbp,
  });
  const policyCeilingGbp = fromRefundPence(policyMaxRefundablePence(breakdown, reason));

  /* Eligible amount fully refunded — idempotent success (fee may still be retained). */
  if (
    order.stripe_refund_id &&
    (isOrderFullyRefunded(alreadyRefunded, orderTotalGbp) ||
      isOrderFullyRefunded(alreadyRefunded, policyCeilingGbp))
  ) {
    return {
      refundId: order.stripe_refund_id,
      refundedAmount: alreadyRefunded,
      refundedAt: undefined,
    };
  }

  /*
   * Refund id present but amount missing/invalid — fail closed.
   * Do not invent order.total as the refunded amount.
   */
  if (order.stripe_refund_id && (!Number.isFinite(alreadyRefunded) || alreadyRefunded <= 0)) {
    return { error: CAPTURE_UNVERIFIED_ERROR };
  }

  const virtualPi = isVirtualPaymentIntentId(order.stripe_payment_intent_id);
  const virtualPath = virtualPi || mustUseVirtualPayments() || !isStripeConfigured();

  let capturedPence: number;
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
    capturedPence = virtualCapture.amountPence;
  } else {
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
    capturedPence = liveCapture.amountPence;
  }

  const maxRefundableGbp = refundableGbp(orderTotalGbp, capturedPence);
  const policyAware = resolveBuyerProtectionAwareRefundGbp({
    itemPriceGbp,
    deliveryFeeGbp,
    protectedFeeGbp,
    totalGbp: orderTotalGbp,
    alreadyRefundedGbp: Number.isFinite(alreadyRefunded) ? alreadyRefunded : 0,
    maxRefundableGbp,
    reason,
    amountGbp: options?.amountGbp,
  });
  if (!policyAware.ok) {
    if (policyAware.error === "No remaining refundable amount.") {
      return {
        refundId: order.stripe_refund_id ?? `wallet-refund-${orderId}`,
        refundedAmount: alreadyRefunded,
        skipped: true,
      };
    }
    return { error: policyAware.error };
  }
  const amount = policyAware.amountGbp;
  const remainingGbp = remainingRefundableGbp(
    Math.min(maxRefundableGbp, policyCeilingGbp),
    Number.isFinite(alreadyRefunded) ? alreadyRefunded : 0,
  );

  if (!(amount > 0) || remainingGbp <= 0) {
    return {
      refundId: order.stripe_refund_id ?? `wallet-refund-${orderId}`,
      refundedAmount: alreadyRefunded,
      skipped: true,
    };
  }

  // Keep resolveRefundIntentAmountGbp as a final clamp against remaining eligible.
  const resolved = resolveRefundIntentAmountGbp({
    remainingGbp,
    amountGbp: amount,
  });
  if (!resolved.ok) {
    return { error: resolved.error };
  }
  const amountFinal = resolved.amountGbp;

  const isPartial = amountFinal + 0.0001 < remainingGbp || alreadyRefunded > 0;
  const refundSeq = Math.round(toRefundPence(alreadyRefunded + amountFinal));
  const refundId =
    options?.idempotencyKey?.trim() ||
    (isPartial ? `wallet-refund-${orderId}-${refundSeq}` : `wallet-refund-${orderId}`);

  if (virtualPath) {
    await applyOrderRefundLifecycle({
      orderId,
      refundId,
      amount: amountFinal,
      stripeStatus: "succeeded",
      paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      notifySeller: options?.notifySeller,
    });
    const { data: updated } = await admin
      .from("orders")
      .select("refund_completed_at, refunded_amount")
      .eq("id", orderId)
      .maybeSingle();
    return {
      refundId,
      refundedAmount: amountFinal,
      refundedAt: updated?.refund_completed_at ?? new Date().toISOString(),
      skipped: true,
    };
  }

  // ROVEXO wallet-credit path: do NOT create a Stripe card refund by default.
  const status = await applyOrderRefundLifecycle({
    orderId,
    refundId,
    amount: amountFinal,
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
    refundedAmount: amountFinal,
    refundedAt: status === "completed" ? updated?.refund_completed_at ?? new Date().toISOString() : undefined,
  };
}

/** @internal test/export alias — pence helpers used by capture verification contracts */
export { fromRefundPence as fromPence, toRefundPence as toPence };
