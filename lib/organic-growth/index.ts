export {
  ORGANIC_GROWTH_ENGINE_VERSION,
  ORGANIC_GROWTH_PLATFORM_NAME,
  MIN_COLLECTION_INVENTORY,
  MIN_COLLECTION_QUALITY,
  POPULARITY_WEIGHTS,
  isCollectionPublishable,
  isTrendStale,
} from "@/lib/organic-growth/config";

export {
  computePopularityScore,
  popularityFromProduct,
  rankProductsByPopularity,
  aggregatePopularity,
  type PopularityScore,
  type PopularitySignals,
} from "@/lib/organic-growth/popularity";

export { buildSearchInsightsReport, type SearchInsightsReport, type SearchInsight } from "@/lib/organic-growth/search-insights";
export { buildZeroResultRecovery, type ZeroResultRecovery, type ZeroResultRecoveryLink } from "@/lib/organic-growth/zero-results";
export { detectGrowthOpportunities, evaluateCollectionOpportunity, type GrowthOpportunity } from "@/lib/organic-growth/opportunity";
export { buildSellerGrowthReport, scoreSellerFromProducts, type SellerGrowthReport } from "@/lib/organic-growth/seller-growth";
export { buildBuyerRetentionPlan, type BuyerRetentionPlan } from "@/lib/organic-growth/buyer-retention";
export { buildEngagementFeed, type EngagementFeed, type EngagementRecommendation } from "@/lib/organic-growth/engagement";
export { buildDiscoveryFeed, getActiveCollectionPages, type DiscoveryFeed, type DiscoveryFeedItem } from "@/lib/organic-growth/discovery";
export { detectGrowingTrends, filterExpiredTrends, type TrendGrowthSignal } from "@/lib/organic-growth/trends";
export { runOrganicGrowthAutomation, type AutomationRunResult } from "@/lib/organic-growth/automation";
export { buildOrganicGrowthDashboard, type OrganicGrowthDashboard } from "@/lib/organic-growth/dashboard";
export { buildPageSocialDiscovery } from "@/lib/organic-growth/social";
export { getOrganicGrowthSnapshot } from "@/lib/organic-growth/reader";
