/**
 * ROVEXO Catalog Master v1.0 — public barrel (ONLY SSOT).
 */

export { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
export { CATALOG_COLOURS, CATALOG_COLOUR_COUNT, type CatalogColour } from "@/lib/catalog/colours";
export {
  CATALOG_CONDITIONS,
  CATALOG_CONDITIONS_ELECTRONICS,
  CATALOG_CONDITIONS_PARTS,
  CATALOG_CONDITIONS_BY_VERTICAL,
} from "@/lib/catalog/conditions";
export {
  CATALOG_NO_BRAND,
  CATALOG_POPULAR_BRANDS,
  CATALOG_BRANDS,
  CATALOG_POPULAR_BRAND_IDS,
} from "@/lib/catalog/brands";
export {
  getBrandsForProductType,
  getBrandsForProductTypePath,
  assertProductTypeBrandsIncludeNoBrand,
  assertProductTypeBrandOrder,
  assertCrossCategoryBrandSeparation,
  getCategoryBrandDatabaseStats,
  orderCategoryBrandDatabase,
} from "@/lib/catalog/brands-by-product-type";
export {
  getMaterialsForProductType,
  getMaterialsForProductTypePath,
  getCategoryMaterialDatabaseStats,
  assertCrossCategoryMaterialSeparation,
  orderCategoryMaterialDatabase,
} from "@/lib/catalog/product-type-material-database-v1";
export { CATALOG_MATERIALS } from "@/lib/catalog/materials";
export { CATALOG_SIZES } from "@/lib/catalog/sizes";
export {
  ATTR,
  ATTR_PRESETS,
  CATALOG_GENDER_OPTIONS,
  CATALOG_AGE_GROUP_OPTIONS,
  CATALOG_PILLOW_TYPES,
  CATALOG_VEHICLE_MAKES,
  type CatalogAttributeDef,
  type CatalogAttributeKey,
  type AttrPresetKey,
} from "@/lib/catalog/attributes";
export {
  CATALOG_SECTORS,
  CATALOG_PRODUCT_TYPE_ATTR_PRESET,
  getAttrPresetForProductTypeSlug,
} from "@/lib/catalog/tree";
export {
  resolveProductTypeAttributes,
  assertAttributeBudget,
} from "@/lib/catalog/product-type-attributes";
export {
  validateCatalogMaster,
  type CatalogValidationReport,
} from "@/lib/catalog/validate";
export {
  CATALOG_MASTER_PROTECTION_V1,
  getCatalogMasterCacheKey,
  assertCatalogMasterTreeOrThrow,
  verifyCatalogMasterProtection,
  assertCatalogMasterProtectionOrBlock,
  runCatalogMasterStartupGate,
  type CatalogMasterProtectionReport,
} from "@/lib/catalog/catalog-master-protection-v1";
export {
  CATALOG_MASTER_FINAL_LAW_XXXII_V1,
  certifyCatalogMasterProductionRelease,
  assertCatalogMasterProductionReleaseOrBlock,
  type CatalogMasterProductionReleaseReport,
} from "@/lib/catalog/catalog-master-final-law-xxxii-v1";
export {
  SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1,
  certifyCatalogMasterBloodLawXxxiii,
  assertCatalogMasterBloodCertificationOrBlock,
  type CatalogMasterBloodCertificationReport,
} from "@/lib/catalog/supreme-blood-law-xxxiii-catalog-master-v1";
export { SUGGEST_SSOT_HARDENING_V1 } from "@/lib/catalog/suggest-ssot-hardening-v1";
export { RUNTIME_CATALOG_FINGERPRINT_LOCK_V1 } from "@/lib/catalog/runtime-catalog-fingerprint-lock-v1";
export {
  getRuntimeCatalogIndex,
  assertRuntimeCatalogIndexOrBlock,
  assertRuntimeCatalogFingerprintOrBlock,
  getCatalogEnvironmentParityReport,
  resetRuntimeCatalogIndexForTests,
  type RuntimeCatalogIndex,
  type RuntimeCatalogFingerprint,
} from "@/lib/catalog/runtime-catalog-index-v1";
