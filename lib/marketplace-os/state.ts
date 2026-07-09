import { evaluateMarketplaceHealth } from "@/lib/marketplace-intelligence/marketplace-health";
import { evaluateBuyerActivity } from "@/lib/marketplace-intelligence/buyer-activity";
import { evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import { clampMosScore, type MosThresholds } from "@/lib/marketplace-os/config";
import type { MarketplaceState } from "@/lib/marketplace-os/types";

/** Marketplace State Engine — continuous marketplace status evaluation. */
export async function evaluateMarketplaceState(thresholds: MosThresholds): Promise<MarketplaceState> {
  const intelThresholds = {
    ...DEFAULT_THRESHOLDS,
    minInventory: thresholds.minInventory,
    minViews: thresholds.minViews,
    minFavorites: thresholds.minFavorites,
    minConversionRate: thresholds.minConversionRate,
    inactiveSellerDays: thresholds.maxInactivityDays,
  };

  const [health, buyers, sellers, search, inventoryGaps] = await Promise.all([
    evaluateMarketplaceHealth(intelThresholds),
    evaluateBuyerActivity(intelThresholds),
    evaluateSellerHealth(intelThresholds),
    evaluateSearchQuality(intelThresholds),
    evaluateInventoryBalance(),
  ]);

  const sellerAvg =
    sellers.length > 0 ? sellers.reduce((sum, entry) => sum + entry.score, 0) / sellers.length : 50;

  const highGaps = inventoryGaps.filter((gap) => gap.severity === "high").length;
  const inventoryStatus: MarketplaceState["inventoryStatus"] =
    highGaps > 5 ? "critical" : highGaps > 0 ? "low" : "healthy";

  const growthStatus: MarketplaceState["growthStatus"] =
    health.score >= 70 ? "growing" : health.score >= 50 ? "stable" : "declining";

  const trafficStatus: MarketplaceState["trafficStatus"] =
    buyers.searchActivity > 100 ? "high" : buyers.searchActivity > 10 ? "normal" : "low";

  const conversionStatus: MarketplaceState["conversionStatus"] =
    search.conversionRate >= thresholds.minConversionRate
      ? "healthy"
      : search.conversionRate > 0
        ? "warning"
        : "critical";

  const healthScore = clampMosScore(health.score);
  const balanceScore = clampMosScore(100 - highGaps * 8);
  const trustScore = clampMosScore(sellerAvg);

  const status: MarketplaceState["status"] =
    healthScore >= 75 && inventoryStatus === "healthy"
      ? "operational"
      : healthScore >= 50
        ? "degraded"
        : "critical";

  return {
    status,
    healthScore,
    balanceScore,
    inventoryStatus,
    growthStatus,
    trafficStatus,
    conversionStatus,
    sellerActivityScore: clampMosScore(sellerAvg),
    buyerActivityScore: buyers.healthScore,
    trustScore,
    evaluatedAt: new Date().toISOString(),
  };
}

export function marketplaceStateToRuleContext(state: MarketplaceState): Record<string, string | number | boolean> {
  return {
    healthScore: state.healthScore,
    balanceScore: state.balanceScore,
    inventoryStatus: state.inventoryStatus,
    growthStatus: state.growthStatus,
    trafficStatus: state.trafficStatus,
    conversionStatus: state.conversionStatus,
    sellerActivityScore: state.sellerActivityScore,
    buyerActivityScore: state.buyerActivityScore,
    trustScore: state.trustScore,
    status: state.status,
  };
}
