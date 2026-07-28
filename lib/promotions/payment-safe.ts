/**
 * Promote payment — fail-closed user copy only.
 * Never expose API / Stripe / stack / internal messages.
 */

export const PROMOTION_PAYMENT_SAFE = {
  processFailed: "Unable to process payment. Please try again.",
  paymentFailed: "Payment failed. Please try again.",
} as const;

export type PromotionPaymentMethodId = "wallet" | "default_card";

/** Map any unknown failure to Owner-safe payment copy. */
export function toPromotionPaymentSafeError(
  kind: "process" | "payment" = "process",
): string {
  return kind === "payment"
    ? PROMOTION_PAYMENT_SAFE.paymentFailed
    : PROMOTION_PAYMENT_SAFE.processFailed;
}

/**
 * Allowlist product-rule messages (gates). Everything else → processFailed.
 * Never pass through technical / Stripe / API wording.
 */
const ALLOWED_PRODUCT_ERRORS = [
  /^Store Showcase requires at least/i,
  /^Store Showcase is disabled while Holiday Mode/i,
  /^Store Showcase is already active/i,
  /^Store Showcase is available for 7 days only/i,
  /^You need at least one active listing/i,
  /^You need at least one published listing/i,
  /^Only published listings can be promoted/i,
  /^Listing not found/i,
  /^Invalid promotion/i,
  /^Insufficient wallet balance/i,
  /^Add a default saved card/i,
  /^Add a default card/i,
  /^Bump cooldown/i,
  /^Boost cooldown/i,
  /^Daily bump limit/i,
  /^A boost is already active/i,
] as const;

export function sanitizePromotionCheckoutError(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return PROMOTION_PAYMENT_SAFE.processFailed;

  if (
    /unable to start|seller promotion checkout|stripe|api error|stack|exception|supabase|service role|secret|internal|checkout session/i.test(
      trimmed,
    )
  ) {
    return PROMOTION_PAYMENT_SAFE.processFailed;
  }

  if (ALLOWED_PRODUCT_ERRORS.some((pattern) => pattern.test(trimmed))) {
    return trimmed.length > 160 ? PROMOTION_PAYMENT_SAFE.processFailed : trimmed;
  }

  if (/payment failed|unable to process payment/i.test(trimmed)) {
    return trimmed.includes("Payment failed")
      ? PROMOTION_PAYMENT_SAFE.paymentFailed
      : PROMOTION_PAYMENT_SAFE.processFailed;
  }

  return PROMOTION_PAYMENT_SAFE.processFailed;
}
