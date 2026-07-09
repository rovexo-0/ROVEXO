/**
 * ROVEXO Organic Growth Engine v1.0 — permanent SSOT configuration.
 * Enterprise organic acquisition ecosystem. Deterministic rules only. No AI decisions.
 */

export const ORGANIC_GROWTH_ENGINE_VERSION = "1.0.0";
export const ORGANIC_GROWTH_PLATFORM_NAME = "ROVEXO Organic Growth Engine";

/** Minimum listings before a collection is published. */
export const MIN_COLLECTION_INVENTORY = 3;

/** Minimum quality score (0–100) before a collection is published. */
export const MIN_COLLECTION_QUALITY = 50;

/** Trend TTL — stale trends expire automatically. */
export const TREND_EXPIRY_DAYS = 14;

/** Collection TTL — seasonal collections expire after days. */
export const SEASONAL_COLLECTION_TTL_DAYS = 90;

/** Popularity signal weights — first-party marketplace data only. */
export const POPULARITY_WEIGHTS = {
  views: 1,
  favorites: 3,
  shares: 4,
  purchases: 10,
  conversionRate: 15,
  recentActivity: 6,
  freshness: 5,
  verifiedSeller: 8,
  premium: 10,
} as const;

/** Zero-result recovery thresholds. */
export const ZERO_RESULT_THRESHOLDS = {
  lowInventory: 3,
  noResults: 0,
} as const;

/** Opportunity detection thresholds. */
export const OPPORTUNITY_THRESHOLDS = {
  categoryCollectionMinListings: 10,
  brandLandingMinListings: 5,
  cityDiscoveryMinListings: 8,
  searchDemandGapRatio: 2,
} as const;

export function isCollectionPublishable(listingCount: number, qualityScore: number): boolean {
  return listingCount >= MIN_COLLECTION_INVENTORY && qualityScore >= MIN_COLLECTION_QUALITY;
}

export function isTrendStale(lastModified: string, ttlDays = TREND_EXPIRY_DAYS): boolean {
  const expires = new Date(lastModified);
  expires.setDate(expires.getDate() + ttlDays);
  return expires < new Date();
}
