/**
 * ROVEXO Sell — Canonical Premium Picker Design Freeze v1.1
 *
 * OWNER LOCKED. Official visual standard for all /sell pickers until
 * Owner explicitly unlocks. Presentation-only; engines/API/DB untouched.
 *
 * COD SÂNGE Category Attribute Database V1.0 (Owner):
 * Local search ENABLED for Brand + Material only.
 * Search FORBIDDEN for Colour · Condition · Size · Pattern · Style · Parcel.
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
    brand: "logo-or-monogram-list-local-search-deduped",
    material: "glyph-list-local-search",
    condition: "tone-icon-title-description-list-no-search",
    category: "premium-search-hierarchy",
  },
  search: {
    brand: true,
    material: true,
    colour: false,
    condition: false,
    size: false,
    pattern: false,
    style: false,
    parcel: false,
    minChars: 2,
    localOnly: true,
  },
  forbidden: [
    "parallel-picker-designs",
    "attribute-engine-rewrites",
    "publish-engine-changes",
    "api-db-routing-validation-changes",
    "search-on-colour-condition-size-pattern-style-parcel",
    "ai-auto-select-attributes",
  ],
  parentFreeze: "lib/sell/sell-ui-v1-freeze.ts",
} as const;

export type SellPremiumPickerFreezeV1 = typeof SELL_PREMIUM_PICKER_FREEZE_V1;
