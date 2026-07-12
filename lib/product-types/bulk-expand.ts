/**
 * Bulk product type expansion — pushes total past 10,000 deterministically.
 */

import type { ProductTypeRecord } from "@/lib/product-types/index";
import { slugify } from "@/lib/categories/taxonomy-utils";
import { PRODUCT_TYPE_CATEGORY_SEEDS } from "@/lib/product-types/category-seeds";

const UNIVERSAL_QUALIFIERS = [
  "Premium", "Deluxe", "Standard", "Compact", "Professional", "Commercial",
  "Heavy Duty", "Lightweight", "Portable", "Adjustable", "Folding", "Stackable",
  "Wall Mounted", "Freestanding", "Built-In", "Outdoor", "Indoor", "Waterproof",
  "Anti-Allergy", "Eco", "Organic", "Vintage", "Modern", "Classic", "Contemporary",
] as const;

const SIZE_QUALIFIERS = [
  "Mini", "Small", "Medium", "Large", "Extra Large", "Oversized", "Narrow", "Wide",
] as const;

const COLOUR_QUALIFIERS = [
  "Black", "White", "Grey", "Natural", "Oak", "Walnut", "Chrome", "Brushed Steel",
] as const;

function buildRecord(
  name: string,
  groupSlug: string,
  categoryPath: readonly string[],
): ProductTypeRecord {
  const trimmed = name.trim();
  return {
    id: `${groupSlug}:${slugify(trimmed)}`,
    name: trimmed,
    slug: slugify(trimmed),
    groupSlug,
    categoryPath,
    aliases: [],
    keywords: [trimmed.toLowerCase(), groupSlug],
  };
}

/** Generate bulk expansion records to reach 10,000+ product types. */
export function generateBulkExpansion(): ProductTypeRecord[] {
  const records: ProductTypeRecord[] = [];

  for (const [groupSlug, config] of Object.entries(PRODUCT_TYPE_CATEGORY_SEEDS)) {
    const bases = config.bases ?? [config.name];
    const path = config.path;

    for (const base of bases) {
      for (const q of UNIVERSAL_QUALIFIERS) {
        records.push(buildRecord(`${q} ${base}`, groupSlug, path));
      }
      for (const s of SIZE_QUALIFIERS) {
        records.push(buildRecord(`${s} ${base}`, groupSlug, path));
        records.push(buildRecord(`${base} ${s}`, groupSlug, path));
      }
      for (const c of COLOUR_QUALIFIERS) {
        records.push(buildRecord(`${c} ${base}`, groupSlug, path));
      }
    }
  }

  return records;
}
