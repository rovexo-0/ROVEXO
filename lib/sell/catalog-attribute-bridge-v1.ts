/**
 * Catalog Master → Sell attribute ids (presentation bridge only).
 * Does not change Category Suggest / Dynamic Category / Publish engines.
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import type { CatalogAttributeKey } from "@/lib/catalog/attributes";
import { resolveProductTypeAttributes } from "@/lib/catalog/product-type-attributes";

const CATALOG_KEY_TO_SELL_ID: Partial<Record<CatalogAttributeKey, string>> = {
  brand: "brand",
  condition: "condition",
  size: "size",
  material: "material",
  colour: "colour",
  model: "model",
  storage: "storage",
  ram: "ram",
  type: "type",
  vehicleMake: "compatibility",
  vehicleModel: "model",
  gender: "gender",
  ageGroup: "age",
  temperatureRating: "temperatureRating",
  seasonRating: "seasonRating",
  length: "length",
  weight: "weight",
  dimensions: "dimensions",
};

function leafSlugFromPath(categoryPath: FlatCategoryPath | null): string | null {
  if (!categoryPath) return null;
  return (
    categoryPath.childCategorySlug?.trim() ||
    categoryPath.segments[categoryPath.segments.length - 1]?.slug?.trim() ||
    null
  );
}

/** Resolve Sell attribute ids from Catalog Master product-type presets. */
export function resolveSellAttributeIdsFromCatalog(
  categoryPath: FlatCategoryPath | null,
): string[] {
  const leaf = leafSlugFromPath(categoryPath);
  if (!leaf) return [];

  const ids: string[] = [];
  for (const attr of resolveProductTypeAttributes(leaf)) {
    const sellId = CATALOG_KEY_TO_SELL_ID[attr.key];
    if (sellId && !ids.includes(sellId)) ids.push(sellId);
  }
  return ids;
}
