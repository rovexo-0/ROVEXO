/**
 * ROVEXO Catalog Master — Brand databases per product-type path.
 * Absolute Law XXX + COD SÂNGE Category Brand Database Expansion.
 * SSOT: `product-type-brand-database-v1.ts` (dedicated DB per Category → Subcategory → Product Type).
 */

export {
  getBrandsForProductType,
  getBrandsForProductTypePath,
  assertProductTypeBrandsIncludeNoBrand,
  assertProductTypeBrandOrder,
  assertCrossCategoryBrandSeparation,
  assertLeafBrandIndependence,
  getCategoryBrandDatabaseStats,
  getAllProductTypeBrandPaths,
  orderCategoryBrandDatabase,
  buildDedicatedBrandDatabase,
  normalizeLeafBrandDataset,
  resetProductTypeBrandDatabaseCacheForTests,
  type ProductTypeBrandContext,
  type CategoryBrandDatabaseStats,
} from "@/lib/catalog/product-type-brand-database-v1";

export {
  resolveCanonicalBrandName,
  getCanonicalBrandRegistry,
  getCanonicalBrandStats,
  findCanonicalBrand,
  type CanonicalBrand,
} from "@/lib/catalog/canonical-brand-registry-v4";
