import type { IntelligenceThresholds, RankingWeights } from "@/lib/marketplace-intelligence/config";

export type HealthScore = {
  score: number;
  status: "healthy" | "warning" | "critical";
  factors: Record<string, number>;
  reasons: string[];
};

export type EntityHealthReport = HealthScore & {
  id: string;
  label: string;
  href?: string;
};

export type ListingQualityFactors = {
  imageCount: number;
  imageResolution: number;
  descriptionLength: number;
  requiredAttributes: number;
  categoryAccuracy: number;
  priceCompleteness: number;
  shippingAvailability: number;
  freshness: number;
  visibility: number;
};

export type ListingQualityReport = {
  listingId: string;
  slug: string;
  title: string;
  score: number;
  completeness: number;
  indexable: boolean;
  factors: ListingQualityFactors;
  issues: string[];
};

export type SellerHealthReport = {
  sellerId: string;
  sellerName: string;
  username: string | null;
  score: number;
  status: "top" | "growing" | "stable" | "inactive" | "at_risk";
  listingQualityAvg: number;
  trustScore: number;
  factors: Record<string, number>;
};

export type CategoryHealthReport = {
  slug: string;
  name: string;
  score: number;
  activeListings: number;
  status: "growing" | "stable" | "declining" | "low_inventory" | "oversaturated";
  demandScore: number;
  conversionRate: number;
  freshnessDays: number;
};

export type SearchQualityMetrics = {
  totalSearches: number;
  zeroResultSearches: number;
  lowResultSearches: number;
  abandonedSearches: number;
  clickThroughRate: number;
  conversionRate: number;
  zeroResultRate: number;
  healthScore: number;
};

export type InventoryGap = {
  id: string;
  dimension: "category" | "brand" | "location" | "seller";
  label: string;
  supply: number;
  demand: number;
  gapRatio: number;
  severity: "high" | "medium" | "low";
};

export type MarketplaceOpportunity = {
  id: string;
  type:
    | "missing_category"
    | "growing_brand"
    | "growing_location"
    | "demand_supply_gap"
    | "popular_search_no_inventory"
    | "fast_growing_store"
    | "new_market";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionPath?: string;
};

export type FeaturedCandidate = {
  id: string;
  type: "product" | "store" | "category" | "collection" | "brand";
  label: string;
  href: string;
  score: number;
  reason: string;
};

export type MarketplaceIntelligenceDocument = {
  version: number;
  updatedAt: string;
  label: string;
  thresholds: IntelligenceThresholds;
  rankingWeights: RankingWeights;
  automationEnabled: boolean;
  refreshIntervalMinutes: number;
  modules: { id: string; label: string; enabled: boolean }[];
  auditLog: { at: string; action: string; actor?: string }[];
};

export type MarketplaceIntelligenceSnapshot = {
  scannedAt: string;
  engineVersion: string;
  document: MarketplaceIntelligenceDocument;
  marketplaceHealth: HealthScore;
  categoryHealth: CategoryHealthReport[];
  sellerHealth: SellerHealthReport[];
  searchQuality: SearchQualityMetrics;
  inventoryGaps: InventoryGap[];
  opportunities: MarketplaceOpportunity[];
  featured: FeaturedCandidate[];
  listingQualitySample: ListingQualityReport[];
  trends: { label: string; href: string; score: number; type: string }[];
};

export type MarketplaceIntelligenceHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy: string;
  label: string;
  bundle: MarketplaceIntelligenceDocument;
  rollbackAvailable: boolean;
};
