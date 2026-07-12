/**
 * Category-scoped taxonomy loader — loads only data relevant to the selected category path.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import { leafSlugFromFlatPath } from "@/lib/categories/types";
import {
  MARKETPLACE_BRANDS,
  POPULAR_BRAND_IDS,
  getBrandsForVertical,
} from "@/lib/brands";
import {
  MARKETPLACE_COLOURS,
  MARKETPLACE_COLOURS_BY_SCOPE,
  type MarketplaceColour,
} from "@/lib/colours";
import {
  MARKETPLACE_MATERIALS,
  getMaterialsForVertical,
} from "@/lib/materials";
import {
  MARKETPLACE_CONDITIONS_BY_VERTICAL,
} from "@/lib/categories/enterprise/conditions";
import {
  MARKETPLACE_DEFAULT_SIZES,
  MARKETPLACE_SIZE_SYSTEMS,
} from "@/lib/categories/enterprise/sizes";
import {
  MARKETPLACE_PATTERNS_BY_VERTICAL,
} from "@/lib/categories/enterprise/databases/patterns";
import {
  MARKETPLACE_STYLES_BY_VERTICAL,
} from "@/lib/categories/enterprise/databases/styles";
import {
  MARKETPLACE_FEATURES_BY_SCOPE,
} from "@/lib/categories/enterprise/databases/features";
import {
  MARKETPLACE_STORAGE_BY_SCOPE,
  RAM_CAPACITIES,
} from "@/lib/categories/enterprise/databases/storage";
import {
  MARKETPLACE_WARRANTY_BY_VERTICAL,
} from "@/lib/categories/enterprise/databases/warranty-types";
import {
  MARKETPLACE_COMPATIBILITY_BY_SCOPE,
} from "@/lib/categories/enterprise/databases/compatibility";
import {
  MARKETPLACE_MANUFACTURERS_BY_VERTICAL,
} from "@/lib/categories/enterprise/databases/manufacturers";
import {
  MARKETPLACE_COUNTRIES_OF_ORIGIN,
} from "@/lib/categories/enterprise/databases/countries";
import {
  PILLOW_SIZES,
  DUVET_SIZES,
} from "@/lib/categories/enterprise/databases/dimensions";
import { loadProductTypesForGroup } from "@/lib/product-types";

export type TaxonomyScope = {
  rootSlug: string;
  subcategorySlug?: string;
  productTypeSlug?: string;
  productFamilySlug?: string;
  slugPath: readonly string[];
  vertical: string;
};

export type CategoryScopedTaxonomy = {
  scope: TaxonomyScope;
  brands: readonly string[];
  popularBrandIds: readonly string[];
  materials: readonly string[];
  colours: readonly MarketplaceColour[];
  sizes: readonly string[];
  patterns: readonly string[];
  styles: readonly string[];
  features: readonly string[];
  storage: readonly string[];
  ram: readonly string[];
  warrantyTypes: readonly string[];
  conditions: readonly string[];
  compatibility: readonly string[];
  manufacturers: readonly string[];
  countriesOfOrigin: readonly string[];
  productTypes: readonly string[];
};

const FASHION_ROOTS = new Set(["mens-fashion", "womens-fashion", "kids-fashion", "shoes"]);
const ELECTRONICS_ROOTS = new Set(["electronics", "phones", "computers", "gaming", "tv-audio"]);
const HOME_ROOTS = new Set(["home-garden", "diy"]);
const BEDDING_SLUGS = new Set([
  "bedding", "duvets", "pillows", "pillowcases", "mattress-protectors",
  "throws", "blankets", "bed-sheets", "duvet-covers",
]);

function resolveVertical(scope: TaxonomyScope): string {
  const { slugPath, rootSlug, productFamilySlug, productTypeSlug, subcategorySlug } = scope;
  const allSlugs = new Set(slugPath);
  const leaf = productFamilySlug ?? productTypeSlug ?? subcategorySlug ?? rootSlug;

  if (allSlugs.has("pillows") || (leaf && leaf.includes("pillow"))) return "pillows";
  if ([...BEDDING_SLUGS].some((s) => allSlugs.has(s))) return "bedding";
  if (FASHION_ROOTS.has(rootSlug)) return "fashion";
  if (ELECTRONICS_ROOTS.has(rootSlug)) return "electronics";
  if (rootSlug === "vehicles" || rootSlug === "autoparts") return "vehicles";
  if (rootSlug === "tools") return "tools";
  if (rootSlug === "sports" || rootSlug === "cycling") return "sports";
  if (rootSlug === "baby") return "baby";
  if (HOME_ROOTS.has(rootSlug)) return "home";
  return "default";
}

export function resolveTaxonomyScope(categoryPath: FlatCategoryPath | null): TaxonomyScope | null {
  if (!categoryPath?.segments.length) return null;
  const slugPath = categoryPath.segments.map((s) => s.slug);
  const scope: TaxonomyScope = {
    rootSlug: slugPath[0] ?? "",
    subcategorySlug: slugPath[1],
    productTypeSlug: slugPath[2],
    productFamilySlug: slugPath[3] ?? leafSlugFromFlatPath(categoryPath),
    slugPath,
    vertical: "default",
  };
  scope.vertical = resolveVertical(scope);
  return scope;
}

function resolveColours(vertical: string): readonly MarketplaceColour[] {
  const scope = vertical as keyof typeof MARKETPLACE_COLOURS_BY_SCOPE;
  return MARKETPLACE_COLOURS_BY_SCOPE[scope] ?? MARKETPLACE_COLOURS;
}

function resolveSizes(scope: TaxonomyScope): readonly string[] {
  if (scope.vertical === "pillows") return PILLOW_SIZES;
  if (scope.vertical === "bedding") return DUVET_SIZES;
  if (scope.vertical === "fashion") return MARKETPLACE_SIZE_SYSTEMS.fashionAlpha;
  if (scope.rootSlug === "shoes") return MARKETPLACE_SIZE_SYSTEMS.shoesUk;
  if (scope.vertical === "home") return MARKETPLACE_SIZE_SYSTEMS.furniture;
  if (scope.vertical === "electronics") return MARKETPLACE_SIZE_SYSTEMS.screens;
  return MARKETPLACE_DEFAULT_SIZES;
}

export function loadCategoryScopedTaxonomy(categoryPath: FlatCategoryPath | null): CategoryScopedTaxonomy | null {
  const scope = resolveTaxonomyScope(categoryPath);
  if (!scope) return null;

  const vertical = scope.vertical;
  const groupSlug = scope.productTypeSlug ?? scope.subcategorySlug ?? "";
  const productTypes = groupSlug
    ? loadProductTypesForGroup(groupSlug).map((p) => p.name)
    : [];

  const brandVertical = vertical === "bedding" ? "home" : vertical === "default" ? "home" : vertical;

  return {
    scope,
    brands: getBrandsForVertical(brandVertical),
    popularBrandIds: POPULAR_BRAND_IDS,
    materials: getMaterialsForVertical(vertical),
    colours: [...resolveColours(vertical)],
    sizes: resolveSizes(scope),
    patterns: MARKETPLACE_PATTERNS_BY_VERTICAL[vertical as keyof typeof MARKETPLACE_PATTERNS_BY_VERTICAL]
      ?? MARKETPLACE_PATTERNS_BY_VERTICAL.default,
    styles: MARKETPLACE_STYLES_BY_VERTICAL[vertical as keyof typeof MARKETPLACE_STYLES_BY_VERTICAL]
      ?? MARKETPLACE_STYLES_BY_VERTICAL.default,
    features: MARKETPLACE_FEATURES_BY_SCOPE[vertical as keyof typeof MARKETPLACE_FEATURES_BY_SCOPE]
      ?? MARKETPLACE_FEATURES_BY_SCOPE.default,
    storage: MARKETPLACE_STORAGE_BY_SCOPE[vertical as keyof typeof MARKETPLACE_STORAGE_BY_SCOPE]
      ?? MARKETPLACE_STORAGE_BY_SCOPE.default,
    ram: RAM_CAPACITIES,
    warrantyTypes: MARKETPLACE_WARRANTY_BY_VERTICAL[vertical as keyof typeof MARKETPLACE_WARRANTY_BY_VERTICAL]
      ?? MARKETPLACE_WARRANTY_BY_VERTICAL.default,
    conditions: MARKETPLACE_CONDITIONS_BY_VERTICAL[vertical as keyof typeof MARKETPLACE_CONDITIONS_BY_VERTICAL]
      ?? MARKETPLACE_CONDITIONS_BY_VERTICAL.default,
    compatibility: MARKETPLACE_COMPATIBILITY_BY_SCOPE[scope.rootSlug as keyof typeof MARKETPLACE_COMPATIBILITY_BY_SCOPE]
      ?? MARKETPLACE_COMPATIBILITY_BY_SCOPE.default,
    manufacturers: MARKETPLACE_MANUFACTURERS_BY_VERTICAL[vertical as keyof typeof MARKETPLACE_MANUFACTURERS_BY_VERTICAL]
      ?? MARKETPLACE_MANUFACTURERS_BY_VERTICAL.default,
    countriesOfOrigin: MARKETPLACE_COUNTRIES_OF_ORIGIN,
    productTypes,
  };
}

export function loadBrandsForCategory(categoryPath: FlatCategoryPath | null): readonly string[] {
  return loadCategoryScopedTaxonomy(categoryPath)?.brands ?? MARKETPLACE_BRANDS;
}

export function loadMaterialsForCategory(categoryPath: FlatCategoryPath | null): readonly string[] {
  return loadCategoryScopedTaxonomy(categoryPath)?.materials ?? MARKETPLACE_MATERIALS;
}

export function loadColoursForCategory(categoryPath: FlatCategoryPath | null): readonly MarketplaceColour[] {
  return loadCategoryScopedTaxonomy(categoryPath)?.colours ?? MARKETPLACE_COLOURS;
}

export function loadSizesForCategory(categoryPath: FlatCategoryPath | null): readonly string[] {
  return loadCategoryScopedTaxonomy(categoryPath)?.sizes ?? MARKETPLACE_DEFAULT_SIZES;
}

export function excludesElectronicsBrands(categoryPath: FlatCategoryPath | null): boolean {
  const scope = resolveTaxonomyScope(categoryPath);
  if (!scope) return false;
  return ["pillows", "bedding", "home", "fashion", "baby"].includes(scope.vertical);
}
