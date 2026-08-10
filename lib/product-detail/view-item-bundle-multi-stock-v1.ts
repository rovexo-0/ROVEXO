/**
 * View Item Bundle multi-stock extension lock — aligns with Bundle Engine Master Spec.
 * Owner architecture: PDP Add to Bundle removed; Store is the canonical creation surface.
 * Stock/quantity rules on View Item remain; creation CTA does not.
 */
export const VIEW_ITEM_BUNDLE_MULTI_STOCK_V1 = {
  version: "1.1",
  parent: "lib/bundle/bundle-engine-v1.ts",
  stockStatusOnlyWhenStockGreaterThan: 1,
  quantityOnlyWhenStockGreaterThan: 1,
  /** PDP CTA authority — permanently false (Owner final architecture). */
  addToBundle: false,
  /** Store Visit / Shop bundles is the sole create surface. */
  storeBundleCreationCanonical: true,
  redesignForbidden: true,
} as const;
