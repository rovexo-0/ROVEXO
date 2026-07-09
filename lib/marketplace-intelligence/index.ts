export {
  MARKETPLACE_INTELLIGENCE_VERSION,
  MARKETPLACE_INTELLIGENCE_NAME,
  DEFAULT_THRESHOLDS,
  DEFAULT_RANKING_WEIGHTS,
  resolveThresholds,
  resolveRankingWeights,
  clampScore,
  meetsThreshold,
} from "@/lib/marketplace-intelligence/config";

export type {
  HealthScore,
  ListingQualityReport,
  SellerHealthReport,
  CategoryHealthReport,
  SearchQualityMetrics,
  InventoryGap,
  MarketplaceOpportunity,
  FeaturedCandidate,
  MarketplaceIntelligenceDocument,
  MarketplaceIntelligenceSnapshot,
} from "@/lib/marketplace-intelligence/types";

export { evaluateMarketplaceHealth, evaluateEntityHealthScores } from "@/lib/marketplace-intelligence/marketplace-health";
export { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
export { evaluateSellerHealth, filterTopSellers, filterAtRiskSellers } from "@/lib/marketplace-intelligence/seller-health";
export { evaluateBuyerActivity } from "@/lib/marketplace-intelligence/buyer-activity";
export { evaluateListingQuality, evaluateProductListingQuality, averageListingQuality } from "@/lib/marketplace-intelligence/listing-quality";
export { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
export { buildMarketplaceZeroResultRecovery } from "@/lib/marketplace-intelligence/zero-result-recovery";
export { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
export { detectMarketplaceOpportunities } from "@/lib/marketplace-intelligence/opportunity";
export { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
export { computeProductRankingScore, rankProducts } from "@/lib/marketplace-intelligence/ranking";
export { determineFeaturedCandidates } from "@/lib/marketplace-intelligence/featured";
export { runMarketplaceIntelligenceAutomation } from "@/lib/marketplace-intelligence/automation";
export { buildMarketplaceIntelligenceDashboard } from "@/lib/marketplace-intelligence/dashboard";
export { getMarketplaceIntelligenceSnapshot, getPublicIntelligenceThresholds } from "@/lib/marketplace-intelligence/reader";
export {
  readLiveMarketplaceIntelligenceDocument,
  getMarketplaceIntelligenceDraft,
  saveMarketplaceIntelligenceDraft,
  publishMarketplaceIntelligence,
  updateMarketplaceIntelligenceThresholds,
} from "@/lib/marketplace-intelligence/engine";
export { createDefaultMarketplaceIntelligenceDocument, INTELLIGENCE_MODULE_IDS } from "@/lib/marketplace-intelligence/defaults";
export { INTELLIGENCE_DASHBOARD_SECTIONS } from "@/lib/marketplace-intelligence/registry";
