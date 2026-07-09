import {
  DEFAULT_RANKING_WEIGHTS,
  DEFAULT_THRESHOLDS,
  MARKETPLACE_INTELLIGENCE_VERSION,
} from "@/lib/marketplace-intelligence/config";
import type {
  MarketplaceIntelligenceDocument,
  MarketplaceIntelligenceHistoryEntry,
} from "@/lib/marketplace-intelligence/types";

const now = () => new Date().toISOString();

export const INTELLIGENCE_MODULE_IDS = [
  { id: "marketplace-health", label: "Marketplace Health" },
  { id: "category-health", label: "Category Health" },
  { id: "seller-health", label: "Seller Health" },
  { id: "buyer-activity", label: "Buyer Activity" },
  { id: "listing-quality", label: "Listing Quality" },
  { id: "search-quality", label: "Search Quality" },
  { id: "zero-result-recovery", label: "Zero Result Recovery" },
  { id: "inventory-balance", label: "Inventory Balance" },
  { id: "opportunities", label: "Marketplace Opportunities" },
  { id: "trends", label: "Trend Engine" },
  { id: "ranking", label: "Ranking Engine" },
  { id: "featured", label: "Featured Engine" },
  { id: "automation", label: "Automation Engine" },
] as const;

export function createDefaultMarketplaceIntelligenceDocument(
  label = "ROVEXO Marketplace Intelligence",
): MarketplaceIntelligenceDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    thresholds: { ...DEFAULT_THRESHOLDS },
    rankingWeights: { ...DEFAULT_RANKING_WEIGHTS },
    automationEnabled: true,
    refreshIntervalMinutes: 15,
    modules: INTELLIGENCE_MODULE_IDS.map((module) => ({ ...module, enabled: true })),
    auditLog: [],
  };
}

export function createDefaultMarketplaceIntelligenceHistory(): MarketplaceIntelligenceHistoryEntry[] {
  return [];
}

export { MARKETPLACE_INTELLIGENCE_VERSION };
