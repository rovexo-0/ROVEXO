/**
 * Canonical refund amount math (pure).
 * Buyer Protection (5.5%) is included in order.total — refundable base is
 * min(order.total, captured). Seller is never charged Buyer Protection.
 */

export function toRefundPence(gbp: number): number {
  return Math.round(Number(gbp) * 100);
}

export function fromRefundPence(pence: number): number {
  return Math.round(Number(pence)) / 100;
}

/** Max refundable GBP = min(order total, live/virtual captured). */
export function refundableGbp(orderTotalGbp: number, capturedPence: number): number {
  const orderTotalPence = toRefundPence(orderTotalGbp);
  const refundablePence = Math.min(orderTotalPence, Math.max(0, Math.round(capturedPence)));
  return fromRefundPence(refundablePence);
}

export function remainingRefundableGbp(
  maxRefundableGbp: number,
  alreadyRefundedGbp: number,
): number {
  const already = Number.isFinite(alreadyRefundedGbp) ? alreadyRefundedGbp : 0;
  return fromRefundPence(
    Math.max(0, toRefundPence(maxRefundableGbp) - toRefundPence(already)),
  );
}

export function accumulateRefundedGbp(
  alreadyRefundedGbp: number,
  thisRefundGbp: number,
): number {
  const already = Number.isFinite(alreadyRefundedGbp) ? alreadyRefundedGbp : 0;
  return fromRefundPence(toRefundPence(already) + toRefundPence(thisRefundGbp));
}

/**
 * Resolve the GBP amount for one refund intent.
 * - Omit amountGbp → full remaining
 * - amountGbp must be > 0 and ≤ remaining
 */
export function resolveRefundIntentAmountGbp(input: {
  remainingGbp: number;
  amountGbp?: number | null;
}): { ok: true; amountGbp: number } | { ok: false; error: string } {
  const remaining = fromRefundPence(toRefundPence(input.remainingGbp));
  if (!(remaining > 0)) {
    return { ok: false, error: "No remaining refundable amount." };
  }
  if (input.amountGbp == null) {
    return { ok: true, amountGbp: remaining };
  }
  const requested = fromRefundPence(toRefundPence(input.amountGbp));
  if (!(requested > 0)) {
    return { ok: false, error: "Invalid partial refund amount." };
  }
  if (requested > remaining + 0.0001) {
    return { ok: false, error: "Invalid partial refund amount." };
  }
  return { ok: true, amountGbp: Math.min(requested, remaining) };
}

export function isOrderFullyRefunded(
  alreadyRefundedGbp: number,
  orderTotalGbp: number,
): boolean {
  if (!Number.isFinite(alreadyRefundedGbp) || alreadyRefundedGbp <= 0) return false;
  return alreadyRefundedGbp >= orderTotalGbp - 0.001;
}
