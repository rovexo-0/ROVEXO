/**
 * ROVEXO Brand Database — canonical SSOT.
 * Target: 2,000+ brands with aliases, slugs, and vertical mapping.
 */

import { dedupeSorted, slugify } from "@/lib/categories/taxonomy-utils";
import { BRAND_SEEDS } from "@/lib/brands/seeds";
import { BRAND_EXPANSION_LINES } from "@/lib/brands/expansion-lines";

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

function buildBrandRecord(name: string, vertical: string, extras?: Partial<BrandRecord>): BrandRecord {
  const trimmed = name.trim();
  return {
    id: trimmed,
    name: trimmed,
    slug: slugify(trimmed),
    aliases: extras?.aliases ?? [],
    keywords: extras?.keywords ?? [trimmed.toLowerCase()],
    verticals: extras?.verticals ?? [vertical],
    country: extras?.country,
    website: extras?.website,
    formerNames: extras?.formerNames,
  };
}

function expandBrandLines(): BrandRecord[] {
  const records: BrandRecord[] = [];
  for (const [parent, lines, vertical] of BRAND_EXPANSION_LINES) {
    for (const line of lines) {
      records.push(
        buildBrandRecord(`${parent} ${line}`, vertical, {
          aliases: [line, `${parent} ${line}`],
          keywords: [parent.toLowerCase(), line.toLowerCase()],
        }),
      );
    }
  }
  return records;
}

function mergeBrandRecords(existing: BrandRecord, incoming: BrandRecord): BrandRecord {
  return {
    ...existing,
    verticals: dedupeSorted([...existing.verticals, ...incoming.verticals]),
    aliases: dedupeSorted([...existing.aliases, ...incoming.aliases]),
    keywords: dedupeSorted([...existing.keywords, ...incoming.keywords]),
    formerNames: dedupeSorted([...(existing.formerNames ?? []), ...(incoming.formerNames ?? [])]),
    country: existing.country ?? incoming.country,
    website: existing.website ?? incoming.website,
  };
}

function buildDatabase(): BrandRecord[] {
  const byId = new Map<string, BrandRecord>();

  for (const [vertical, brands] of Object.entries(BRAND_SEEDS)) {
    for (const entry of brands) {
      const record = typeof entry === "string"
        ? buildBrandRecord(entry, vertical)
        : buildBrandRecord(entry.name, vertical, entry);
      const key = record.id.toLowerCase();
      const existing = byId.get(key);
      byId.set(key, existing ? mergeBrandRecords(existing, record) : record);
    }
  }

  for (const record of expandBrandLines()) {
    const key = record.id.toLowerCase();
    const existing = byId.get(key);
    byId.set(key, existing ? mergeBrandRecords(existing, record) : record);
  }

  return [...byId.values()];
}

export const BRAND_DATABASE: BrandRecord[] = buildDatabase();

export const MARKETPLACE_BRANDS: readonly string[] = BRAND_DATABASE.map((b) => b.name);

export const MARKETPLACE_BRANDS_BY_VERTICAL = Object.fromEntries(
  [...new Set(BRAND_DATABASE.flatMap((b) => b.verticals))].map((vertical) => [
    vertical,
    BRAND_DATABASE.filter((b) => b.verticals.includes(vertical)).map((b) => b.name),
  ]),
) as Record<string, readonly string[]>;

export const POPULAR_BRAND_IDS = [
  "Nike", "Adidas", "Apple", "Samsung", "Sony", "Zara", "H&M", "BMW", "Ford", "Levi's",
  "IKEA", "Dyson", "Tempur", "LEGO", "Argos",
] as const;

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

// Vertical exports for backward compatibility
export const VEHICLE_BRANDS = getBrandsForVertical("vehicles");
export const ELECTRONICS_BRANDS = getBrandsForVertical("electronics");
export const FASHION_BRANDS = getBrandsForVertical("fashion");
export const HOME_BRANDS = getBrandsForVertical("home");
export const PILLOW_BRANDS = getBrandsForVertical("pillows");
export const TOOL_BRANDS = getBrandsForVertical("tools");
export const SPORTS_BRANDS = getBrandsForVertical("sports");
export const BABY_BRANDS = getBrandsForVertical("baby");
