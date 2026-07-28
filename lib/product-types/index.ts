/**
 * ROVEXO Product Type Database — Catalog Master SSOT.
 * Product types = leaves of Category → Subcategory → Product Type.
 */

import { CATALOG_SECTORS } from "@/lib/catalog/tree";
import { slugify } from "@/lib/categories/taxonomy-utils";

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

function buildFromCatalog(): ProductTypeRecord[] {
  const records: ProductTypeRecord[] = [];

  for (const sector of CATALOG_SECTORS) {
    for (const dept of sector.departments) {
      const flat = [...(dept.items ?? [])];
      for (const group of dept.groups ?? []) {
        for (const [name, slug] of group.items) {
          flat.push([name, slug]);
          records.push({
            id: `${group.slug}:${slug}`,
            name,
            slug,
            groupSlug: group.slug,
            categoryPath: [sector.slug, dept.slug, group.slug, slug],
            aliases: [],
            keywords: [name.toLowerCase(), group.slug, dept.slug],
          });
        }
      }
      for (const [name, slug] of dept.items ?? []) {
        records.push({
          id: `${dept.slug}:${slug}`,
          name,
          slug,
          groupSlug: dept.slug,
          categoryPath: [sector.slug, dept.slug, slug],
          aliases: [],
          keywords: [name.toLowerCase(), dept.slug, sector.slug],
        });
      }
      void flat;
    }
  }

  const seen = new Set<string>();
  return records.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export const PRODUCT_TYPE_DATABASE: ProductTypeRecord[] = buildFromCatalog();
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

export function findProductTypeBySlug(slug: string): ProductTypeRecord | undefined {
  return PRODUCT_TYPE_DATABASE.find((r) => r.slug === slug);
}

export function searchProductTypes(query: string, limit = 20): ProductTypeRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCT_TYPE_DATABASE.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.slug.includes(slugify(q)) ||
      r.keywords.some((k) => k.includes(q)),
  ).slice(0, limit);
}
