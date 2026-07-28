/**
 * ROVEXO Brand Database — Catalog Master SSOT.
 * Always includes "No Brand". Compact popular + extended set.
 */

import {
  CATALOG_BRANDS,
  CATALOG_NO_BRAND,
  CATALOG_POPULAR_BRANDS,
} from "@/lib/catalog/brands";
import { slugify } from "@/lib/categories/taxonomy-utils";

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  aliases: readonly string[];
  keywords: readonly string[];
  verticals: readonly string[];
  country?: string;
  website?: string;
  formerNames?: readonly string[];
};

function toRecord(name: string): BrandRecord {
  return {
    id: name,
    name,
    slug: slugify(name),
    aliases: name === CATALOG_NO_BRAND ? ["Unbranded", "None"] : [],
    keywords: [name.toLowerCase()],
    verticals: ["general"],
  };
}

export const BRAND_DATABASE: BrandRecord[] = [...CATALOG_BRANDS].map(toRecord);

export const MARKETPLACE_BRANDS: readonly string[] = BRAND_DATABASE.map((b) => b.name);

export const MARKETPLACE_BRANDS_BY_VERTICAL: Record<string, readonly string[]> = {
  general: MARKETPLACE_BRANDS,
  fashion: MARKETPLACE_BRANDS,
  electronics: MARKETPLACE_BRANDS,
  home: MARKETPLACE_BRANDS,
  sports: MARKETPLACE_BRANDS,
  baby: MARKETPLACE_BRANDS,
  tools: MARKETPLACE_BRANDS,
  pillows: MARKETPLACE_BRANDS,
  vehicles: MARKETPLACE_BRANDS,
};

export const POPULAR_BRAND_IDS = CATALOG_POPULAR_BRANDS;

export const BRAND_COUNT = BRAND_DATABASE.length;

export function getBrandsForVertical(vertical: string): readonly string[] {
  return MARKETPLACE_BRANDS_BY_VERTICAL[vertical] ?? MARKETPLACE_BRANDS;
}

export function findBrandByName(name: string): BrandRecord | undefined {
  const lower = name.trim().toLowerCase();
  return BRAND_DATABASE.find(
    (b) =>
      b.name.toLowerCase() === lower ||
      b.aliases.some((a) => a.toLowerCase() === lower) ||
      b.keywords.some((k) => k === lower),
  );
}

export function validateBrand(name: string): boolean {
  return findBrandByName(name) !== undefined;
}

export const VEHICLE_BRANDS = getBrandsForVertical("vehicles");
export const ELECTRONICS_BRANDS = getBrandsForVertical("electronics");
export const FASHION_BRANDS = getBrandsForVertical("fashion");
export const HOME_BRANDS = getBrandsForVertical("home");
export const PILLOW_BRANDS = getBrandsForVertical("pillows");
export const TOOL_BRANDS = getBrandsForVertical("tools");
export const SPORTS_BRANDS = getBrandsForVertical("sports");
export const BABY_BRANDS = getBrandsForVertical("baby");
