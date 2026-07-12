/**
 * Lazy loaders — dynamic imports for category-scoped datasets.
 * Avoids loading unrelated vertical data into memory.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";

type BrandModule = typeof import("@/lib/brands");
type MaterialModule = typeof import("@/lib/materials");
type ColourModule = typeof import("@/lib/colours");
type ProductTypeModule = typeof import("@/lib/product-types");

let brandsModule: BrandModule | null = null;
let materialsModule: MaterialModule | null = null;
let coloursModule: ColourModule | null = null;
let productTypesModule: ProductTypeModule | null = null;

export async function lazyLoadBrands(): Promise<BrandModule> {
  brandsModule ??= await import("@/lib/brands");
  return brandsModule;
}

export async function lazyLoadMaterials(): Promise<MaterialModule> {
  materialsModule ??= await import("@/lib/materials");
  return materialsModule;
}

export async function lazyLoadColours(): Promise<ColourModule> {
  coloursModule ??= await import("@/lib/colours");
  return coloursModule;
}

export async function lazyLoadProductTypes(): Promise<ProductTypeModule> {
  productTypesModule ??= await import("@/lib/product-types");
  return productTypesModule;
}

/** Lazy load scoped brands for a category path. */
export async function lazyLoadBrandsForCategory(
  categoryPath: FlatCategoryPath | null,
): Promise<readonly string[]> {
  const { loadBrandsForCategory } = await import("@/lib/category-loaders/scoped");
  return loadBrandsForCategory(categoryPath);
}
