/**
 * Sell Size visibility — Catalog Master taxonomy only (no manual toggles).
 * Size shows only when the leaf product-type preset includes `size`.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import {
  CATALOG_CLOTHING_SIZES,
  CATALOG_KIDS_CLOTHING_SIZES,
  CATALOG_RING_SIZES_UK,
  CATALOG_UK_SHOE_SIZES,
} from "@/lib/catalog/sizes";
import { resolveProductTypeAttributes } from "@/lib/catalog/product-type-attributes";
import type { CatalogAttributeDef } from "@/lib/catalog/attributes";

function leafSlugFromPath(categoryPath: FlatCategoryPath | null): string | null {
  if (!categoryPath) return null;
  const fromSegments = categoryPath.segments[categoryPath.segments.length - 1]?.slug;
  return (
    categoryPath.childCategorySlug?.trim() ||
    fromSegments?.trim() ||
    categoryPath.subcategorySlug?.trim() ||
    null
  );
}

/** True when Catalog Master essential attrs for this leaf include Size. */
export function catalogPathRequiresSize(categoryPath: FlatCategoryPath | null): boolean {
  const leaf = leafSlugFromPath(categoryPath);
  if (!leaf) return false;
  return resolveProductTypeAttributes(leaf).some((attr) => attr.key === "size");
}

export function catalogSizeAttributeDef(
  categoryPath: FlatCategoryPath | null,
): CatalogAttributeDef | null {
  const leaf = leafSlugFromPath(categoryPath);
  if (!leaf) return null;
  return resolveProductTypeAttributes(leaf).find((attr) => attr.key === "size") ?? null;
}

/** Size option labels from Catalog Master option key (clothing / shoes / kids / rings). */
export function catalogSizeOptionsForPath(categoryPath: FlatCategoryPath | null): readonly string[] {
  const def = catalogSizeAttributeDef(categoryPath);
  switch (def?.options) {
    case "shoeSizes":
      return CATALOG_UK_SHOE_SIZES;
    case "kidsSizes":
      return CATALOG_KIDS_CLOTHING_SIZES;
    case "ringSizes":
      return CATALOG_RING_SIZES_UK;
    case "clothingSizes":
    default:
      return CATALOG_CLOTHING_SIZES;
  }
}
