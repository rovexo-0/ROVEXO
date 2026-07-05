/**
 * ROVEXO Marketplace Taxonomy Engine — single source of truth barrel.
 *
 * Every module (Sell, Homepage, Search, Filters, Category Pages, Admin)
 * should import marketplace taxonomy from here or `@/lib/categories/tree`.
 */

export {
  categoryTree,
  homeCategories,
  taxonomyStats,
  ENTERPRISE_SECTORS,
  buildEnterpriseTree,
  countTreeNodes,
} from "@/lib/categories/marketplace-tree";

export type {
  CategoryNode,
  CategoryPath,
  CategorySegment,
  FlatCategoryPath,
} from "@/lib/categories/types";

export {
  CATEGORY_PATH_SEPARATOR,
  formatCategoryPathLabel,
  flatPathFromSegments,
  leafSlugFromFlatPath,
} from "@/lib/categories/types";

export {
  findNodeBySlugPath,
  collectLeafPaths,
  breadcrumbsFromPath,
  segmentsFromPath,
  getCategoryHrefFromSlugs,
} from "@/lib/categories/navigation";

export type { CategoryBreadcrumb } from "@/lib/categories/navigation";

export {
  flattenCategoryPaths,
  resolveCategoryPathBySlugs,
  getCategoryTree,
} from "@/lib/categories/queries";

export { getFiltersForCategorySlug } from "@/lib/categories/filters";

export {
  CATEGORY_SEARCH_SYNONYMS,
  CATEGORY_SEGMENT_ALIASES,
  expandSearchSynonyms,
} from "@/lib/categories/search-synonyms";

export {
  searchCategoryPicker,
  warmCategoryPickerIndex,
  type CategoryPickerResult,
} from "@/lib/sell/category-picker-search";

export {
  getAttributeDefsForCategory,
  getAttributeIdsForCategoryPath,
  type AttributeDef,
} from "@/lib/categories/attribute-definitions";

export {
  recordCategorySelection,
  getRecentCategoryPaths,
  getFrequentCategoryPaths,
  getPopularCategoryPaths,
  getTrendingCategoryPaths,
  getRecommendedCategoryPaths,
  resolveStoredCategoryPath,
} from "@/lib/categories/category-history";

export {
  validateMarketplaceTaxonomy,
  type TaxonomyValidationReport,
} from "@/lib/categories/validate-taxonomy";

export {
  exportTaxonomyBackup,
  parseTaxonomyBackup,
  stringifyTaxonomyBackup,
  diffTaxonomyBackup,
  type TaxonomyBackupBundle,
  TAXONOMY_BACKUP_VERSION,
} from "@/lib/categories/taxonomy-manager";

export {
  MARKETPLACE_BRANDS,
  MARKETPLACE_BRANDS_BY_VERTICAL,
  POPULAR_BRAND_IDS,
} from "@/lib/categories/enterprise/brands";

export { MARKETPLACE_COLOURS } from "@/lib/categories/enterprise/colours";

export {
  MARKETPLACE_DEFAULT_SIZES,
  MARKETPLACE_SIZE_SYSTEMS,
} from "@/lib/categories/enterprise/sizes";

export {
  MARKETPLACE_MATERIALS,
  MARKETPLACE_MATERIALS_BY_VERTICAL,
} from "@/lib/categories/enterprise/materials";

export {
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_CONDITIONS_BY_VERTICAL,
} from "@/lib/categories/enterprise/conditions";

export { EXTENDED_MARKETPLACE_SYNONYMS } from "@/lib/categories/enterprise/marketplace-synonyms";

export { syncEnterpriseTaxonomyToDatabase } from "@/lib/categories/sync-db";

export {
  TRANSACTION_MODES,
  DEFAULT_TRANSACTION_MODE,
  DIRECT_CONTACT_ROOT_SLUGS,
  getTransactionCapabilities,
  isDirectContactMode,
  isMarketplaceMode,
  resolveTransactionModeForRootSlug,
  resolveTransactionModeFromFlatPath,
  resolveTransactionModeFromCategoryPathPayload,
  stampTransactionModeOnTree,
  type TransactionCapabilities,
  type TransactionMode,
} from "@/lib/transaction-mode";
