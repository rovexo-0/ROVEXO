/**
 * ROVEXO SELL FLOW — Category Row v1.0
 *
 * STATUS: OWNER APPROVED · UI LOCK · FEATURE LOCK · FREEZE CERTIFIED
 * Official: http://localhost:3000/sell
 *
 * Single canonical Category Row for the entire Sell Flow.
 * No alternative implementations · no duplicate render paths · no legacy rows.
 *
 * Post-freeze (Owner approval only for structural/visual change):
 * bug fixes · performance · accessibility
 */
export const CATEGORY_ROW_V1_FREEZE = {
  version: "1.0",
  status: "FREEZE_CERTIFIED",
  uiLock: true,
  featureLock: true,
  freezeCertified: true,
  approvedByOwner: true,
  officialRoute: "/sell",
  officialLocalhost: "http://localhost:3000/sell",
  canonicalName: "Category Row v1.0",

  equation:
    "ONE SELL = ONE CATEGORY ROW = ONE ICON · ONE LABEL · ONE BREADCRUMB · ONE CHEVRON",

  renderTree: [
    "SellCategoryBlock",
    "SellNavRow",
    "ListingAttributeRow",
    "SellFieldMasterIcon (single)",
    "ListingAttributeLabel (Category)",
    "Category Breadcrumb (description)",
    "Chevron",
  ] as const,

  canonicalFiles: [
    "features/sell/ui/SellCategoryBlock.tsx",
    "features/sell/ui/SellPrimitives.tsx",
    "components/listing/ListingAttributeRow.tsx",
    "components/listing/ListingAttributeLabel.tsx",
  ] as const,

  structure: {
    icon: "exactly_one_master_icon",
    label: "exactly_one_ListingAttributeLabel",
    breadcrumb: "exactly_one_description_under_label",
    chevron: "exactly_one_right_chevron",
    valueSlot: "never_category_path",
  } as const,

  typography: {
    label: {
      font: "Inter",
      sizePx: 16,
      weight: 500,
      lineHeightPx: 24,
      color: "#111111",
    },
    breadcrumb: {
      font: "Inter",
      sizePx: 14,
      weight: 400,
      lineHeightPx: 22,
      color: "secondary",
    },
  } as const,

  rootCauseResolved: [
    "category_path_not_in_right_value_slot",
    "category_path_under_label_as_description",
    "duplicate_icon_wrapper_removed",
    "duplicate_aria_label_removed",
    "single_ListingAttributeLabel",
    "single_render_path",
    "no_css_hide_hacks",
  ] as const,

  forbidden: [
    "duplicate_ListingAttributeLabel",
    "ListingAttributeIcon_double_wrap",
    "duplicate_aria_label_Category",
    "category_path_as_ListingAttributeValue",
    "absolute_positioning_hacks",
    "negative_margins",
    "display_none_fixes",
    "opacity_fixes",
    "z_index_fixes",
    "css_masking",
    "parallel_category_row_components",
    "legacy_category_row_paths",
  ] as const,

  allowedAfterFreeze: [
    "bug_fixes",
    "performance_improvements",
    "accessibility_improvements",
  ] as const,

  regressionSurfaces: [
    "Category",
    "Brand",
    "Condition",
    "Colour",
    "Material",
    "Size",
    "Parcel",
    "Shipping",
  ] as const,

  parents: {
    sellUiV1: "lib/sell/sell-ui-v1-freeze.ts",
    bloodXxii: "lib/supreme-blood-code-xxii-v1.ts",
    absoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
  } as const,
} as const;

export type CategoryRowV1Freeze = typeof CATEGORY_ROW_V1_FREEZE;

export function assertCategoryRowV1FreezeOrBlock(): void {
  if (
    !CATEGORY_ROW_V1_FREEZE.freezeCertified ||
    !CATEGORY_ROW_V1_FREEZE.uiLock ||
    !CATEGORY_ROW_V1_FREEZE.featureLock
  ) {
    throw new Error(
      "CATEGORY_ROW_V1_FREEZE: Category Row v1.0 must remain UI LOCK · FEATURE LOCK · FREEZE CERTIFIED",
    );
  }
}
