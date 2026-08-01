/**
 * ROVEXO Sell — Canonical Premium Picker Design Freeze v1.0
 *
 * OWNER LOCKED. Official visual standard for all /sell pickers until
 * Owner explicitly unlocks. Presentation-only; engines/API/DB untouched.
 */
export const SELL_PREMIUM_PICKER_FREEZE_V1 = {
  version: "1.1",
  status: "FROZEN",
  host: "http://localhost:3000/sell",
  equation:
    "ONE SELL = ONE PICKER FAMILY = SAME HEADER · SELECTED · SPACING · TYPOGRAPHY",
  surfaces: {
    colour: "compact-4-col-swatch-grid-no-search",
    parcel: "premium-shipping-cards-no-search",
    brand: "logo-or-monogram-list-no-search-deduped",
    material: "glyph-list-no-search",
    condition: "tone-icon-title-description-list",
    category: "premium-search-hierarchy",
  },
  forbidden: [
    "parallel-picker-designs",
    "attribute-engine-rewrites",
    "publish-engine-changes",
    "api-db-routing-validation-changes",
    "search-on-brand-material-colour-parcel",
  ],
  parentFreeze: "lib/sell/sell-ui-v1-freeze.ts",
} as const;

export type SellPremiumPickerFreezeV1 = typeof SELL_PREMIUM_PICKER_FREEZE_V1;
