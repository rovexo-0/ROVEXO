/**
 * ROVEXO Buyer Protection Fee — refund eligibility (canonical pure math).
 *
 * Historical fee charged at checkout is immutable (`orders.protected_fee`).
 * Default: fee is NOT refundable. Only explicit PLATFORM_ERROR may refund it.
 *
 * Monetary unit: integer minor units (pence). No floating-point finance math.
 */

import { fromPence, toPence } from "@/lib/orders/pricing";

/** Canonical refund reasons for Buyer Protection eligibility. */
export type BuyerProtectionRefundReason =
  | "RETURN"
  | "DAMAGE"
  | "LOST"
  | "ITEM_NOT_AS_DESCRIBED"
  | "SELLER_CANCEL"
  | "PLATFORM_ERROR"
  | "OTHER";

export const BUYER_PROTECTION_FEE_REFUNDABLE_DEFAULT = false as const;

export type OrderFinancialBreakdownPence = {
  itemAmountPence: number;
  shippingAmountPence: number;
  buyerProtectionFeePence: number;
  totalAmountPence: number;
};

export type RefundCalculationPence = {
  itemRefundAmountPence: number;
  shippingRefundAmountPence: number;
  buyerProtectionFeeRefundAmountPence: number;
  totalRefundAmountPence: number;
  reason: BuyerProtectionRefundReason;
};

export type RefundCalculationGbp = {
  itemRefundAmount: number;
  shippingRefundAmount: number;
  buyerProtectionFeeRefundAmount: number;
  totalRefundAmount: number;
  reason: BuyerProtectionRefundReason;
};

function asNonNegInt(value: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

/**
 * Build breakdown in pence from order GBP fields.
 * `protected_fee` is the historical Buyer Protection amount (SSOT).
 */
export function buildOrderFinancialBreakdownPence(input: {
  itemPriceGbp: number;
  deliveryFeeGbp: number;
  protectedFeeGbp: number;
  totalGbp: number;
}): OrderFinancialBreakdownPence {
  return {
    itemAmountPence: asNonNegInt(toPence(input.itemPriceGbp)),
    shippingAmountPence: asNonNegInt(toPence(input.deliveryFeeGbp)),
    buyerProtectionFeePence: asNonNegInt(toPence(input.protectedFeeGbp)),
    totalAmountPence: asNonNegInt(toPence(input.totalGbp)),
  };
}

/** Only PLATFORM_ERROR may authorize a Buyer Protection fee refund. */
export function isBuyerProtectionFeeRefundAuthorized(
  reason: BuyerProtectionRefundReason,
): boolean {
  return reason === "PLATFORM_ERROR";
}

/**
 * Max refundable under policy (before capture / already-refunded caps).
 * Default excludes Buyer Protection fee. When fee is 0, equals total
 * (backward compatible with fee-less fixtures).
 */
export function policyMaxRefundablePence(
  breakdown: OrderFinancialBreakdownPence,
  reason: BuyerProtectionRefundReason,
): number {
  if (isBuyerProtectionFeeRefundAuthorized(reason)) {
    return breakdown.totalAmountPence;
  }
  if (breakdown.buyerProtectionFeePence <= 0) {
    return breakdown.totalAmountPence;
  }
  const itemShip = breakdown.itemAmountPence + breakdown.shippingAmountPence;
  const withoutFee = Math.max(
    0,
    breakdown.totalAmountPence - breakdown.buyerProtectionFeePence,
  );
  return itemShip > 0 ? Math.min(itemShip, withoutFee) : withoutFee;
}

/**
 * Derive how much of the Buyer Protection fee has already been refunded
 * from cumulative `refunded_amount` (no dedicated column required).
 */
export function derivedBuyerProtectionFeeRefundedPence(
  breakdown: OrderFinancialBreakdownPence,
  alreadyRefundedPence: number,
): number {
  const already = asNonNegInt(alreadyRefundedPence);
  const nonFee = Math.max(
    0,
    breakdown.totalAmountPence - breakdown.buyerProtectionFeePence,
  );
  return Math.max(
    0,
    Math.min(breakdown.buyerProtectionFeePence, already - nonFee),
  );
}

/**
 * Calculate a ROVEXO refund intent (pure).
 *
 * Default: buyerProtectionFeeRefundAmountPence = 0.
 * PLATFORM_ERROR: may refund the remaining unrefunded fee portion.
 */
export function calculateRovexoRefundPence(input: {
  breakdown: OrderFinancialBreakdownPence;
  reason: BuyerProtectionRefundReason;
  itemRefundAmountPence?: number;
  shippingRefundAmountPence?: number;
  alreadyRefundedPence?: number;
  /** Capture-capped ceiling: min(order.total, captured) in pence */
  maxRefundablePence: number;
}): { ok: true; refund: RefundCalculationPence } | { ok: false; error: string } {
  const { breakdown, reason } = input;
  const already = asNonNegInt(input.alreadyRefundedPence ?? 0);
  const captureCap = asNonNegInt(input.maxRefundablePence);
  const policyCap = policyMaxRefundablePence(breakdown, reason);
  const hardCap = Math.min(captureCap, policyCap, breakdown.totalAmountPence);
  const remainingCap = Math.max(0, hardCap - already);

  if (remainingCap <= 0) {
    return { ok: false, error: "No remaining refundable amount." };
  }

  let itemRefund =
    input.itemRefundAmountPence == null
      ? breakdown.itemAmountPence
      : Math.min(asNonNegInt(input.itemRefundAmountPence), breakdown.itemAmountPence);
  let shippingRefund =
    input.shippingRefundAmountPence == null
      ? breakdown.shippingAmountPence
      : Math.min(
          asNonNegInt(input.shippingRefundAmountPence),
          breakdown.shippingAmountPence,
        );

  const feeAlready = derivedBuyerProtectionFeeRefundedPence(breakdown, already);
  const feeRemaining = Math.max(0, breakdown.buyerProtectionFeePence - feeAlready);
  let feeRefund = isBuyerProtectionFeeRefundAuthorized(reason) ? feeRemaining : 0;

  // Fee-less / incomplete component rows (legacy fixtures & mocks):
  // when no Buyer Protection fee and components are unset/zero, eligible = total.
  if (
    input.itemRefundAmountPence == null &&
    input.shippingRefundAmountPence == null &&
    breakdown.buyerProtectionFeePence <= 0 &&
    itemRefund + shippingRefund === 0 &&
    breakdown.totalAmountPence > 0
  ) {
    itemRefund = breakdown.totalAmountPence;
  }

  let total = itemRefund + shippingRefund + feeRefund;
  if (total <= 0) {
    return { ok: false, error: "Invalid partial refund amount." };
  }

  // Clamp to remaining capacity: drop fee first, then shipping, then item.
  if (total > remainingCap) {
    let overflow = total - remainingCap;
    const feeCut = Math.min(feeRefund, overflow);
    feeRefund -= feeCut;
    overflow -= feeCut;
    const shipCut = Math.min(shippingRefund, overflow);
    shippingRefund -= shipCut;
    overflow -= shipCut;
    itemRefund -= Math.min(itemRefund, overflow);
    total = itemRefund + shippingRefund + feeRefund;
  }

  if (total <= 0) {
    return { ok: false, error: "No remaining refundable amount." };
  }

  if (already + total > breakdown.totalAmountPence) {
    return { ok: false, error: "Refund exceeds paid amount." };
  }

  return {
    ok: true,
    refund: {
      itemRefundAmountPence: itemRefund,
      shippingRefundAmountPence: shippingRefund,
      buyerProtectionFeeRefundAmountPence: feeRefund,
      totalRefundAmountPence: total,
      reason,
    },
  };
}

export function refundCalculationPenceToGbp(
  refund: RefundCalculationPence,
): RefundCalculationGbp {
  return {
    itemRefundAmount: fromPence(refund.itemRefundAmountPence),
    shippingRefundAmount: fromPence(refund.shippingRefundAmountPence),
    buyerProtectionFeeRefundAmount: fromPence(
      refund.buyerProtectionFeeRefundAmountPence,
    ),
    totalRefundAmount: fromPence(refund.totalRefundAmountPence),
    reason: refund.reason,
  };
}

/**
 * Resolve the GBP amount the canonical refund engine should execute.
 * - amountGbp omitted → full remaining eligible under policy
 * - amountGbp provided → must be ≤ remaining eligible (never full PI automatically)
 */
export function resolveBuyerProtectionAwareRefundGbp(input: {
  itemPriceGbp: number;
  deliveryFeeGbp: number;
  protectedFeeGbp: number;
  totalGbp: number;
  alreadyRefundedGbp: number;
  maxRefundableGbp: number;
  reason?: BuyerProtectionRefundReason | null;
  amountGbp?: number | null;
}):
  | { ok: true; amountGbp: number; calculation: RefundCalculationGbp }
  | { ok: false; error: string } {
  const reason: BuyerProtectionRefundReason = input.reason ?? "OTHER";
  const breakdown = buildOrderFinancialBreakdownPence({
    itemPriceGbp: input.itemPriceGbp,
    deliveryFeeGbp: input.deliveryFeeGbp,
    protectedFeeGbp: input.protectedFeeGbp,
    totalGbp: input.totalGbp,
  });

  if (input.amountGbp == null) {
    const calculated = calculateRovexoRefundPence({
      breakdown,
      reason,
      alreadyRefundedPence: toPence(input.alreadyRefundedGbp),
      maxRefundablePence: toPence(input.maxRefundableGbp),
    });
    if (!calculated.ok) return calculated;
    return {
      ok: true,
      amountGbp: fromPence(calculated.refund.totalRefundAmountPence),
      calculation: refundCalculationPenceToGbp(calculated.refund),
    };
  }

  const policyCap = policyMaxRefundablePence(breakdown, reason);
  const hardCap = Math.min(
    toPence(input.maxRefundableGbp),
    policyCap,
    breakdown.totalAmountPence,
  );
  const already = toPence(input.alreadyRefundedGbp);
  const remaining = Math.max(0, hardCap - already);
  const requested = toPence(input.amountGbp);

  if (!(requested > 0)) {
    return { ok: false, error: "Invalid partial refund amount." };
  }
  if (requested > remaining) {
    return { ok: false, error: "Invalid partial refund amount." };
  }
  if (already + requested > breakdown.totalAmountPence) {
    return { ok: false, error: "Refund exceeds paid amount." };
  }

  const feeAuth = isBuyerProtectionFeeRefundAuthorized(reason);
  const nonFee = Math.max(
    0,
    breakdown.totalAmountPence - breakdown.buyerProtectionFeePence,
  );
  const nonFeeAlready = Math.min(already, nonFee);
  const nonFeeRemaining = Math.max(0, nonFee - nonFeeAlready);
  const feeRemaining = Math.max(
    0,
    breakdown.buyerProtectionFeePence -
      derivedBuyerProtectionFeeRefundedPence(breakdown, already),
  );

  let toNonFee = 0;
  let toFee = 0;
  if (feeAuth) {
    toNonFee = Math.min(requested, nonFeeRemaining);
    toFee = Math.min(requested - toNonFee, feeRemaining);
  } else {
    toNonFee = requested;
    toFee = 0;
  }

  const refund: RefundCalculationPence = {
    itemRefundAmountPence: toNonFee,
    shippingRefundAmountPence: 0,
    buyerProtectionFeeRefundAmountPence: toFee,
    totalRefundAmountPence: toNonFee + toFee,
    reason,
  };

  // Explicit amount already validated; keep total === requested.
  if (refund.totalRefundAmountPence !== requested) {
    refund.itemRefundAmountPence += requested - refund.totalRefundAmountPence;
    refund.totalRefundAmountPence = requested;
  }

  return {
    ok: true,
    amountGbp: fromPence(requested),
    calculation: refundCalculationPenceToGbp(refund),
  };
}
