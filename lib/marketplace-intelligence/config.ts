/**
 * ROVEXO Marketplace Intelligence Platform v1.0 — SSOT configuration.
 * All thresholds live here; runtime reads from live document with these defaults.
 */

export const MARKETPLACE_INTELLIGENCE_VERSION = "1.0.0";
export const MARKETPLACE_INTELLIGENCE_NAME = "ROVEXO Marketplace Intelligence Platform";

export type IntelligenceThresholds = {
  minInventory: number;
  minViews: number;
  minFavorites: number;
  minConversionRate: number;
  minQualityScore: number;
  minReviewScore: number;
  minListingCompleteness: number;
  minSellerHealthScore: number;
  minCategoryHealthScore: number;
  lowInventoryThreshold: number;
  oversaturatedListingsPerCategory: number;
  zeroResultRecoveryMinLinks: number;
  featuredMinQualityScore: number;
  featuredMinViews: number;
  inactiveSellerDays: number;
  atRiskSellerHealthScore: number;
};

export const DEFAULT_THRESHOLDS: IntelligenceThresholds = {
  minInventory: 3,
  minViews: 10,
  minFavorites: 2,
  minConversionRate: 0.01,
  minQualityScore: 55,
  minReviewScore: 3.5,
  minListingCompleteness: 60,
  minSellerHealthScore: 50,
  minCategoryHealthScore: 45,
  lowInventoryThreshold: 5,
  oversaturatedListingsPerCategory: 500,
  zeroResultRecoveryMinLinks: 3,
  featuredMinQualityScore: 70,
  featuredMinViews: 25,
  inactiveSellerDays: 30,
  atRiskSellerHealthScore: 40,
};

export type RankingWeights = {
  freshness: number;
  views: number;
  favorites: number;
  conversion: number;
  sellerQuality: number;
  listingCompleteness: number;
  verifiedStatus: number;
  inventoryAvailability: number;
  premium: number;
  boost: number;
  featured: number;
};

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  freshness: 30,
  views: 20,
  favorites: 15,
  conversion: 25,
  sellerQuality: 20,
  listingCompleteness: 15,
  verifiedStatus: 10,
  inventoryAvailability: 10,
  premium: 100,
  boost: 80,
  featured: 60,
};

export type HealthDimensionWeights = {
  marketplace: number;
  categories: number;
  sellers: number;
  listings: number;
  search: number;
  inventory: number;
  buyers: number;
};

export const DEFAULT_HEALTH_WEIGHTS: HealthDimensionWeights = {
  marketplace: 1,
  categories: 0.15,
  sellers: 0.2,
  listings: 0.2,
  search: 0.15,
  inventory: 0.15,
  buyers: 0.15,
};

export function resolveThresholds(overrides?: Partial<IntelligenceThresholds>): IntelligenceThresholds {
  return { ...DEFAULT_THRESHOLDS, ...overrides };
}

export function resolveRankingWeights(overrides?: Partial<RankingWeights>): RankingWeights {
  return { ...DEFAULT_RANKING_WEIGHTS, ...overrides };
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function meetsThreshold(value: number, threshold: number): boolean {
  return value >= threshold;
}
