/**
 * ROVEXO View Item — Attribute Visibility Engine v1.0
 *
 * Category Attribute Schema (Catalog Master) drives which rows may render.
 * Never hardcode Size / Brand / Material layouts. Missing value → skip row.
 */

import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import {
  type CatalogAttributeDef,
  type CatalogAttributeKey,
} from "@/lib/catalog/attributes";
import { resolveProductTypeAttributes } from "@/lib/catalog/product-type-attributes";
import type { ProductInformationFieldId } from "@/lib/product-detail/product-information-field-map-v1";

export const VIEW_ITEM_ATTRIBUTE_ENGINE_V1 = {
  version: "1.0",
  status: "OWNER_CERTIFIED",
} as const;

/** Platform rows always eligible when valued (not from category schema). */
export const VIEW_ITEM_PLATFORM_FIELDS = ["category", "uploaded"] as const;

/**
 * Catalog attribute key → Product Information field id.
 * Keys without a View Item value source are omitted (fail closed).
 */
const CATALOG_KEY_TO_FIELD: Partial<Record<CatalogAttributeKey, ProductInformationFieldId>> = {
  brand: "brand",
  condition: "condition",
  material: "material",
  colour: "colour",
  size: "size",
  storage: "storage",
  seasonRating: "season",
};

export function leafSlugFromCategoryBreadcrumbs(
  breadcrumbs: readonly CategoryBreadcrumb[] | null | undefined,
): string | null {
  if (!breadcrumbs?.length) return null;
  const leaf = breadcrumbs[breadcrumbs.length - 1]?.slug?.trim();
  return leaf || null;
}

export function resolveCategoryAttributeSchema(
  leafSlug: string | null | undefined,
): readonly CatalogAttributeDef[] {
  if (!leafSlug?.trim()) return [];
  return resolveProductTypeAttributes(leafSlug.trim());
}

export function catalogAttributeSupportsField(
  schema: readonly CatalogAttributeDef[],
  fieldId: ProductInformationFieldId,
): boolean {
  if ((VIEW_ITEM_PLATFORM_FIELDS as readonly string[]).includes(fieldId)) return true;
  return schema.some((attr) => CATALOG_KEY_TO_FIELD[attr.key] === fieldId);
}

export function fieldIdForCatalogAttribute(
  attr: CatalogAttributeDef,
): ProductInformationFieldId | null {
  return CATALOG_KEY_TO_FIELD[attr.key] ?? null;
}

/**
 * Display label from Catalog Master attribute + leaf-specific size naming.
 */
export function viewItemAttributeLabel(
  attr: CatalogAttributeDef,
  leafSlug: string | null,
): string {
  if (attr.key !== "size") return attr.label;

  const leaf = (leafSlug ?? "").toLowerCase();
  if (attr.options === "ringSizes" || leaf === "rings") return "Ring Size";
  if (leaf === "helmets" || leaf.includes("helmet")) return "Helmet Size";
  if (leaf === "gloves" || leaf.includes("glove")) return "Glove Size";
  if (leaf.includes("belt") && !leaf.includes("bag")) return "Belt Size";
  if (attr.options === "shoeSizes") return "Size";
  if (attr.label === "UK Size") return "Size";
  return attr.label;
}

/**
 * Ordered schema-driven field entries for View Item (deduped by field id).
 * First catalog attr that maps to a field wins (e.g. seasonRating before temperatureRating).
 */
export function orderedViewItemSchemaFields(
  leafSlug: string | null,
): readonly { fieldId: ProductInformationFieldId; label: string }[] {
  const schema = resolveCategoryAttributeSchema(leafSlug);
  const seen = new Set<ProductInformationFieldId>();
  const out: { fieldId: ProductInformationFieldId; label: string }[] = [];

  for (const attr of schema) {
    const fieldId = fieldIdForCatalogAttribute(attr);
    if (!fieldId || seen.has(fieldId)) continue;
    seen.add(fieldId);
    out.push({ fieldId, label: viewItemAttributeLabel(attr, leafSlug) });
  }

  return out;
}

/** True when Size may appear on View Item for this category leaf. */
export function categoryAllowsSizeAttribute(leafSlug: string | null | undefined): boolean {
  const schema = resolveCategoryAttributeSchema(leafSlug);
  return schema.some((attr) => attr.key === "size");
}
