/**
 * ROVEXO Organic Growth Platform v4.0 — permanent SSOT configuration.
 * Final enterprise SEO ecosystem. Zero manual SEO. Deterministic rules only.
 */

export const SEO_ENGINE_VERSION = "4.0.0";
export const PLATFORM_NAME = "ROVEXO Organic Growth Platform";

/** Minimum published listings before a page is indexable. */
export const MIN_INVENTORY_TO_INDEX = 3;

/** Long-tail combinations require higher inventory to avoid thin pages. */
export const MIN_INVENTORY_LONG_TAIL = 5;

/** Soft threshold — renders but noindex below index threshold. */
export const MIN_INVENTORY_SOFT = 1;

/** Minimum index quality score (0–100) required for indexing. */
export const MIN_QUALITY_SCORE_TO_INDEX = 55;

/** Minimum search demand normalized score for long-tail indexing. */
export const MIN_DEMAND_FOR_LONG_TAIL = 20;

/** Trend pages expire after days without growth signals. */
export const TREND_TTL_DAYS = 14;

/** Freshness window for newly listed / updated signals. */
export const FRESH_LISTING_DAYS = 7;

/** Sitemap chunk size — supports 100M+ URLs via segmented files. */
export const SITEMAP_CHUNK_SIZE = 50_000;

/** Lighthouse / CWV production targets. */
export const PERFORMANCE_TARGETS = {
  lighthouse: 95,
  performance: 95,
  accessibility: 95,
  bestPractices: 95,
  seo: 95,
} as const;

/** Price collection tiers (GBP). */
export const PRICE_COLLECTION_TIERS = [10, 25, 50, 100, 250, 500, 1000] as const;

/** Crawl / sitemap priority bands. */
export const PRIORITY = {
  homepage: 1,
  category: 0.85,
  programmatic: 0.75,
  collection: 0.72,
  trend: 0.7,
  product: 0.7,
  brand: 0.68,
  store: 0.6,
  longTail: 0.65,
  lowValue: 0.3,
} as const;

/** Search demand signal weights — first-party marketplace data only. */
export const DEMAND_WEIGHTS = {
  views: 1,
  likes: 3,
  orders: 10,
  conversionRate: 15,
  freshness: 5,
  premium: 8,
  inventory: 4,
  internalSearch: 6,
} as const;

export type FacetIndexDecision = "index" | "noindex" | "canonical" | "ignore";

export type ZeroResultAction = "noindex" | "redirect" | "canonical";

export function isIndexableInventory(listingCount: number, longTail = false): boolean {
  const min = longTail ? MIN_INVENTORY_LONG_TAIL : MIN_INVENTORY_TO_INDEX;
  return listingCount >= min;
}

export function isIndexableQuality(score: number): boolean {
  return score >= MIN_QUALITY_SCORE_TO_INDEX;
}

export function isFullyIndexable(listingCount: number, qualityScore: number, longTail = false): boolean {
  return isIndexableInventory(listingCount, longTail) && isIndexableQuality(qualityScore);
}
