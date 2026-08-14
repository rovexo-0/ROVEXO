/**
 * ROVEXO v1.0 — canonical buyer shipping price (integer pence only).
 *
 * BUYER_SHIPPING_PRICE_PENCE = RAW_PROVIDER_PRICE_PENCE + 10
 *
 * One calculation for checkout display · checkout total · order persistence.
 * Never floating-point money arithmetic. Never hardcode buyer display prices.
 *
 * Distinct from INTERNAL_LABEL_PLATFORM_FEE_PENCE (label generation revenue).
 */

/** Exactly 10 pence per shipping label / quote — buyer-facing margin. */
export const BUYER_SHIPPING_MARGIN_PENCE = 10 as const;

export const BUYER_SHIPPING_PRICE_V1 = {
  version: "v1.0",
  currency: "GBP" as const,
  moneyUnit: "PENCE" as const,
  marginPence: BUYER_SHIPPING_MARGIN_PENCE,
  equation: "BUYER = PROVIDER_PENCE + 10",
} as const;

function toNonNegativeIntPence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

/**
 * Canonical buyer shipping amount in integer pence.
 * @param providerPricePence Raw Sendcloud / provider quote in pence
 */
export function toBuyerShippingPricePence(providerPricePence: number): number {
  return toNonNegativeIntPence(providerPricePence) + BUYER_SHIPPING_MARGIN_PENCE;
}

/** Format integer pence as GBP major units for UI / order money fields (2dp). */
export function penceToGbpMajor(pence: number): number {
  return toNonNegativeIntPence(pence) / 100;
}

/** Inverse for bridges that only have GBP major — converts via integer pence. */
export function gbpMajorToPence(gbp: number): number {
  if (!Number.isFinite(gbp) || gbp < 0) return 0;
  return Math.round(gbp * 100);
}

export function toBuyerShippingGbpFromProviderPence(providerPricePence: number): number {
  return penceToGbpMajor(toBuyerShippingPricePence(providerPricePence));
}
