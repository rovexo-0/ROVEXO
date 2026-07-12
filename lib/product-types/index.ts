/**
 * ROVEXO Product Type Database — canonical SSOT.
 * Target: 10,000+ product types with category mapping.
 */

import { slugify, dedupeByKey } from "@/lib/categories/taxonomy-utils";
import {
  PRODUCT_TYPE_SEEDS,
  PRODUCT_TYPE_QUALIFIERS,
  PRODUCT_TYPE_MATERIAL_PREFIXES,
} from "@/lib/product-types/seeds";
import { PRODUCT_TYPE_CATEGORY_SEEDS } from "@/lib/product-types/category-seeds";
import { generateBulkExpansion } from "@/lib/product-types/bulk-expand";

export type ProductTypeRecord = {
  id: string;
  name: string;
  slug: string;
  groupSlug: string;
  categoryPath: readonly string[];
  aliases: readonly string[];
  keywords: readonly string[];
};

export type CatalogItem = readonly [name: string, slug: string];

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

function expandGroup(
  groupSlug: string,
  bases: readonly string[],
  categoryPath: readonly string[],
): ProductTypeRecord[] {
  const records: ProductTypeRecord[] = [];
  const qualifiers = PRODUCT_TYPE_QUALIFIERS[groupSlug] ?? PRODUCT_TYPE_QUALIFIERS.default ?? [];
  const materials = PRODUCT_TYPE_MATERIAL_PREFIXES[groupSlug] ?? [];

  for (const base of bases) {
    records.push(buildRecord(base, groupSlug, categoryPath));

    for (const q of qualifiers) {
      records.push(buildRecord(`${q} ${base}`, groupSlug, categoryPath));
      records.push(buildRecord(`${base} ${q}`, groupSlug, categoryPath));
    }

    for (const mat of materials) {
      if (!base.toLowerCase().includes(mat.toLowerCase())) {
        records.push(buildRecord(`${mat} ${base}`, groupSlug, categoryPath));
      }
    }
  }

  return records;
}

function generateProductTypes(): ProductTypeRecord[] {
  const all: ProductTypeRecord[] = [];

  for (const [groupSlug, bases] of Object.entries(PRODUCT_TYPE_SEEDS)) {
    const config = PRODUCT_TYPE_CATEGORY_SEEDS[groupSlug];
    const path = config?.path ?? ["general", groupSlug];
    all.push(...expandGroup(groupSlug, bases, path));
  }

  // Expand from category seeds for groups without explicit seeds
  for (const [groupSlug, config] of Object.entries(PRODUCT_TYPE_CATEGORY_SEEDS)) {
    if (PRODUCT_TYPE_SEEDS[groupSlug]) continue;
    const bases = config.bases ?? [config.name];
    all.push(...expandGroup(groupSlug, bases, config.path));
  }

  all.push(...generateBulkExpansion());

  return dedupeByKey(all, (r) => `${r.groupSlug}:${r.slug}`);
}

export const PRODUCT_TYPE_DATABASE: ProductTypeRecord[] = generateProductTypes();
export const PRODUCT_TYPE_COUNT = PRODUCT_TYPE_DATABASE.length;

/** Get product families (catalog items) for a category group slug. */
export function getProductFamiliesForGroup(groupSlug: string): CatalogItem[] {
  return PRODUCT_TYPE_DATABASE
    .filter((r) => r.groupSlug === groupSlug)
    .map((r) => [r.name, r.slug] as CatalogItem);
}

/** Lazy-loaded catalog items — only loads types for the requested group. */
export function loadProductTypesForGroup(groupSlug: string): readonly ProductTypeRecord[] {
  return PRODUCT_TYPE_DATABASE.filter((r) => r.groupSlug === groupSlug);
}

export function validateProductType(name: string, groupSlug?: string): boolean {
  const lower = name.trim().toLowerCase();
  return PRODUCT_TYPE_DATABASE.some(
    (r) =>
      r.name.toLowerCase() === lower &&
      (!groupSlug || r.groupSlug === groupSlug),
  );
}

export function getProductTypeCountForGroup(groupSlug: string): number {
  return PRODUCT_TYPE_DATABASE.filter((r) => r.groupSlug === groupSlug).length;
}
