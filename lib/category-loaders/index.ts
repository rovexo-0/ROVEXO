/**
 * ROVEXO Category Loaders — lazy, category-scoped data loading.
 * Single canonical loader surface for Sell, Search, Filters.
 */

export {
  loadCategoryScopedTaxonomy,
  loadBrandsForCategory,
  loadMaterialsForCategory,
  loadColoursForCategory,
  loadSizesForCategory,
  resolveTaxonomyScope,
  excludesElectronicsBrands,
  type CategoryScopedTaxonomy,
  type TaxonomyScope,
} from "@/lib/category-loaders/scoped";

export {
  lazyLoadBrands,
  lazyLoadMaterials,
  lazyLoadColours,
  lazyLoadProductTypes,
} from "@/lib/category-loaders/lazy";
