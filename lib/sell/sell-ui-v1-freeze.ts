/**
 * ROVEXO SELL v1.0 — UI/UX FREEZE (COD SÂNGE)
 *
 * STATUS: OWNER LOCKED · UI/UX FROZEN
 * Official: http://localhost:3000/sell
 *
 * Presentation frozen. Engines / API / DB / routing / validation untouched.
 * Post-freeze: bug · performance · a11y · responsive · internal refactor only
 * (zero visual / UX / functional change without Owner unlock).
 */
export const SELL_UI_V1_FREEZE = {
  version: "1.0",
  status: "UI_UX_FROZEN",
  codename: "SELL_V1_COD_SANGE_UI_FREEZE",
  approvedByOwner: true,
  freezeLocked: true,
  permanentlyFrozenUntilOwnerUnlock: true,
  officialRoute: "/sell",
  officialLocalhost: "http://localhost:3000/sell",

  scopeFrozen: [
    "Sell Flow",
    "Photo Upload",
    "Title",
    "Description",
    "Category",
    "Attribute Engine UI",
    "Brand",
    "Material",
    "Colours",
    "Condition",
    "Compatibility",
    "Price",
    "Quantity",
    "Parcel",
    "Publish",
  ] as const,

  visualFrozen: [
    "spacing",
    "padding",
    "typography",
    "icons",
    "shadows",
    "radius",
    "colours",
    "search fields",
    "picker family",
    "animations",
    "responsive layout",
  ] as const,

  logicUntouched: [
    "Publish Engine",
    "Attribute Engine",
    "Validation",
    "AI Category",
    "Upload",
    "Category Engine",
    "Routing",
    "API",
    "Database",
    "Supabase",
    "IDs",
    "Enums",
  ] as const,

  canonicalComponents: [
    "features/sell/ui/SellPage.tsx",
    "features/sell/context/SellProvider.tsx",
    "features/sell/ui/SellCategoryPicker.tsx",
    "features/sell/ui/SellOptionPicker.tsx",
    "features/sell/ui/SellPricingBlock.tsx",
    "features/sell/ui/SellStockQuantityBlock.tsx",
    "features/sell/ui/SellParcelBlock.tsx",
    "features/sell/ui/SellPublishBar.tsx",
  ] as const,

  premiumPickerStandard: {
    brand: "logo-or-monogram-list-local-search-deduped",
    material: "glyph-list-local-search",
    condition: "tone-icon-title-description-list-no-search",
    colours: "compact-4-col-swatch-grid-no-search",
    category: "premium-search-hierarchy",
    parcel: "premium-shipping-cards-no-search",
    inheritance: "ALL_FUTURE_SELL_PICKERS_MUST_INHERIT",
  } as const,

  lastAllowedVisualAdjustmentsBeforeFreeze: [
    "Official brand logos where available",
    "Brand duplicate elimination",
    "Colours compact single-page grid without Search",
    "Material with local Search (COD SÂNGE V1.0)",
    "Brand with local Search (COD SÂNGE V1.0)",
    "Parcel premium cards without Search",
  ] as const,

  allowedAfterFreeze: [
    "bug_fixes",
    "performance_optimizations",
    "accessibility",
    "responsive_remediation",
    "internal_refactors_zero_ui_ux_change",
  ] as const,

  forbiddenAfterFreeze: [
    "design_changes",
    "ux_changes",
    "functional_changes",
    "parallel_pickers",
    "duplicate_components",
    "engine_rewrites",
  ] as const,

  parents: {
    bloodXxii: "lib/supreme-blood-code-xxii-v1.ts",
    absoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
    premiumPickers: "lib/sell/sell-premium-picker-freeze-v1.ts",
    sellUiV1: "lib/sell/sell-ui-v1-freeze.ts",
    categoryRowV1: "lib/sell/category-row-v1-freeze.ts",
  } as const,
} as const;

export type SellUiV1Freeze = typeof SELL_UI_V1_FREEZE;
