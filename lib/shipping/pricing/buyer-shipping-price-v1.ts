/**
 * ROVEXO Shipping Pricing v1.0 — canonical buyer shipping price (integer pence only).
 *
 * PROVIDER_SHIPPING_COST_PENCE = raw Sendcloud / provider quote (never invented)
 * ROVEXO_MARGIN_PENCE          = 15 × labelCount  (per label / shipment, not per item)
 * BUYER_SHIPPING_PRICE_PENCE   = PROVIDER + ROVEXO_MARGIN
 *
 * One calculation for checkout display · checkout total · order persistence · label ledger.
 * Never floating-point money arithmetic. Never hardcode buyer display prices.
 * Never treat buyer `delivery_fee` as the provider cost.
 */

/** Exactly 15 pence per label / shipment — ROVEXO margin. */
export const BUYER_SHIPPING_MARGIN_PENCE = 15 as const;

export const BUYER_SHIPPING_PRICE_V1 = {
  version: "v1.2",
  currency: "GBP" as const,
  moneyUnit: "PENCE" as const,
  marginPencePerLabel: BUYER_SHIPPING_MARGIN_PENCE,
  equation: "BUYER = PROVIDER_PENCE + (15 × LABEL_COUNT)",
  scope: "per_label_not_per_item",
} as const;

export type SeparatedShippingPricesPence = {
  /** Raw Sendcloud / provider cost in pence. */
  providerShippingCostPence: number;
  /** ROVEXO margin = 15 × labelCount. */
  rovexoMarginPence: number;
  /** Buyer pays = provider + margin. */
  buyerShippingPricePence: number;
  /** Number of real labels / shipments this margin covers. */
  labelCount: number;
};

function toNonNegativeIntPence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function normalizeLabelCount(labelCount?: number): number {
  if (labelCount == null || !Number.isFinite(labelCount)) return 1;
  return Math.max(1, Math.trunc(labelCount));
}

/** ROVEXO margin for N labels — never scales with item quantity. */
export function toRovexoShippingMarginPence(labelCount: number = 1): number {
  return BUYER_SHIPPING_MARGIN_PENCE * normalizeLabelCount(labelCount);
}

/**
 * Canonical buyer shipping amount in integer pence.
 * @param providerPricePence Raw Sendcloud / provider quote in pence
 * @param labelCount Real labels/shipments (default 1). Not product quantity.
 */
export function toBuyerShippingPricePence(
  providerPricePence: number,
  labelCount: number = 1,
): number {
  return (
    toNonNegativeIntPence(providerPricePence) + toRovexoShippingMarginPence(labelCount)
  );
}

/** Keep provider cost and buyer price explicitly separated. */
export function separateShippingPricesPence(input: {
  providerShippingCostPence: number;
  labelCount?: number;
}): SeparatedShippingPricesPence {
  const labelCount = normalizeLabelCount(input.labelCount);
  const providerShippingCostPence = toNonNegativeIntPence(
    input.providerShippingCostPence,
  );
  const rovexoMarginPence = toRovexoShippingMarginPence(labelCount);
  return {
    providerShippingCostPence,
    rovexoMarginPence,
    buyerShippingPricePence: providerShippingCostPence + rovexoMarginPence,
    labelCount,
  };
}

/**
 * Recover provider cost when only the buyer total is known.
 * NON-AUTHORITATIVE — diagnostic / display bridges only.
 * NEVER use this to invent provider cost for labels, ledger, or paid-order persistence.
 * Prefer resolveAuthoritativeProviderShippingCostPence instead.
 */
export function deriveProviderShippingCostPenceFromBuyer(input: {
  buyerShippingPricePence: number;
  labelCount?: number;
}): number {
  const labelCount = normalizeLabelCount(input.labelCount);
  const buyer = toNonNegativeIntPence(input.buyerShippingPricePence);
  const margin = toRovexoShippingMarginPence(labelCount);
  if (buyer < margin) return 0;
  return buyer - margin;
}

/**
 * Authoritative provider cost only — Sendcloud/provider quote fields.
 * Never substitutes orders.delivery_fee / buyer shipping.
 * Returns null when provider cost cannot be proven (fail closed).
 */
export function resolveAuthoritativeProviderShippingCostPence(input: {
  providerShippingCostPence?: number | null;
  /** ShippingQuote.pricePence — must already be provider cost, never buyer fee. */
  quotePricePence?: number | null;
}): number | null {
  const candidates = [input.providerShippingCostPence, input.quotePricePence];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return Math.trunc(value);
    }
  }
  return null;
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

export function toBuyerShippingGbpFromProviderPence(
  providerPricePence: number,
  labelCount: number = 1,
): number {
  return penceToGbpMajor(toBuyerShippingPricePence(providerPricePence, labelCount));
}
