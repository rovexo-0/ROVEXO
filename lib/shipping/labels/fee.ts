/**
 * Internal platform label fee — NEVER export to client responses or UI.
 * £0.15 per generated label, stored separately as platform revenue.
 */
export const INTERNAL_LABEL_PLATFORM_FEE_PENCE = 15;

export function applyInternalLabelFee(pricePence: number): {
  buyerPricePence: number;
  platformFeePence: number;
} {
  return {
    buyerPricePence: pricePence,
    platformFeePence: INTERNAL_LABEL_PLATFORM_FEE_PENCE,
  };
}
