/**
 * Canonical listing price normalisation for DB `products_price_check` (price > 0).
 * PostgreSQL `numeric(12,2)` rounds sub-penny values to 0.00 → constraint violation.
 */

export const LISTING_PRICE_MIN = 0.01;

export function normalizeListingPrice(raw: number): number {
  if (!Number.isFinite(raw)) {
    throw new Error("Enter a price greater than zero.");
  }
  const rounded = Math.round((raw + Number.EPSILON) * 100) / 100;
  if (rounded < LISTING_PRICE_MIN) {
    throw new Error("Enter a price of at least £0.01.");
  }
  return rounded;
}
