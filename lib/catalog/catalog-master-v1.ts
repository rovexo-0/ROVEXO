/**
 * ROVEXO CATALOG MASTER v1.0
 * Absolute Laws XXX · XXXI · XXXII · Blood Law XXXIII
 *
 * STATUS: CERTIFIED | LOCKED | PRODUCTION READY | FINAL SYSTEM FREEZE
 *
 * Architecture frozen. Only catalog CONTENT may evolve.
 * Sell Page / UI / UX / Flow / Publishing permanently LOCKED.
 * ONLY category source — Catalog Master → getCategoryTree() → SSOT.
 */

export const CATALOG_MASTER_V1 = {
  version: "1.0",
  /** Content revision — bump when Catalog Master leaves/categories change (cache + index invalidation). */
  contentRevision: "uk-960-rc2b-2026-08-01",
  law: "XXX",
  protectionLaw: "XXXI",
  finalLaw: "XXXII",
  bloodLaw: "XXXIII",
  name: "ROVEXO Catalog Master",
  status: "CERTIFIED_LOCKED_PRODUCTION_READY",
  certified: true,
  productionReady: true,
  permanentlyLocked: true,
  systemFrozen: true,
  rewrittenAt: "2026-07-25",
  lockedAt: "2026-07-25",
  certifiedAt: "2026-07-25",
  contentRevisedAt: "2026-08-01",
  equation: "CATEGORY > SUBCATEGORY > PRODUCT_TYPE > ESSENTIAL_ATTRIBUTES",
  resolutionPath: "Catalog Master → getCategoryTree() → SSOT",
  rootCount: 10,
  maxHierarchyDepth: 3,
  maxAttributesPerProductType: 6,
  minAttributesPerProductType: 3,
  courierOnly: true,
  ukCompliant: true,
  vehiclePartsOwnRoot: true,
  sellPageFrozen: true,
  onlyCategorySource: true,
  contentMayEvolve: true,
  architectureFrozen: true,
  forbiddenRoots: [
    "vehicles",
    "property",
    "business",
    "jobs",
    "services",
    "live-animals",
    "real-estate",
    "aircraft",
  ] as const,
  requiredRoots: [
    "womens-fashion",
    "mens-fashion",
    "jewellery",
    "kids-fashion",
    "home-garden",
    "electronics",
    "books",
    "collectibles",
    "sports",
    "vehicle-parts",
  ] as const,
} as const;

export type CatalogMasterV1 = typeof CATALOG_MASTER_V1;
