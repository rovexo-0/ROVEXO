/**
 * View Item Bundle multi-stock extension lock — aligns with Bundle Engine Master Spec.
 */
export const VIEW_ITEM_BUNDLE_MULTI_STOCK_V1 = {
  version: "1.0",
  parent: "lib/bundle/bundle-engine-v1.ts",
  stockStatusOnlyWhenStockGreaterThan: 1,
  quantityOnlyWhenStockGreaterThan: 1,
  addToBundle: true,
  redesignForbidden: true,
} as const;
