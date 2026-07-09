import { clampScore, DEFAULT_HEALTH_WEIGHTS, type IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
import { evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { evaluateBuyerActivity } from "@/lib/marketplace-intelligence/buyer-activity";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import type { HealthScore } from "@/lib/marketplace-intelligence/types";

/** Marketplace Health Engine — composite health score for the entire marketplace. */
export async function evaluateMarketplaceHealth(
  thresholds: IntelligenceThresholds,
): Promise<HealthScore> {
  const [categories, sellers, search, buyers, inventoryGaps] = await Promise.all([
    evaluateCategoryHealth(thresholds),
    evaluateSellerHealth(thresholds),
    evaluateSearchQuality(thresholds),
    evaluateBuyerActivity(thresholds),
    evaluateInventoryBalance(),
  ]);

  const categoryAvg =
    categories.length > 0
      ? categories.reduce((sum, entry) => sum + entry.score, 0) / categories.length
      : 50;
  const sellerAvg =
    sellers.length > 0 ? sellers.reduce((sum, entry) => sum + entry.score, 0) / sellers.length : 50;
  const inventoryHealth = clampScore(100 - inventoryGaps.filter((gap) => gap.severity === "high").length * 8);

  const factors = {
    categories: categoryAvg,
    sellers: sellerAvg,
    search: search.healthScore,
    buyers: buyers.healthScore,
    inventory: inventoryHealth,
  };

  const score = clampScore(
    factors.categories * DEFAULT_HEALTH_WEIGHTS.categories +
      factors.sellers * DEFAULT_HEALTH_WEIGHTS.sellers +
      factors.search * DEFAULT_HEALTH_WEIGHTS.search +
      factors.buyers * DEFAULT_HEALTH_WEIGHTS.buyers +
      factors.inventory * DEFAULT_HEALTH_WEIGHTS.inventory,
  );

  const reasons: string[] = [];
  if (categoryAvg < thresholds.minCategoryHealthScore) reasons.push("category_health_low");
  if (sellerAvg < thresholds.minSellerHealthScore) reasons.push("seller_health_low");
  if (search.zeroResultRate > 0.2) reasons.push("high_zero_result_rate");
  if (inventoryGaps.filter((gap) => gap.severity === "high").length > 3) reasons.push("inventory_gaps");

  const status: HealthScore["status"] =
    score >= 75 ? "healthy" : score >= 55 ? "warning" : "critical";

  return { score, status, factors, reasons };
}

export async function evaluateEntityHealthScores(thresholds: IntelligenceThresholds) {
  const [marketplace, categories, sellers] = await Promise.all([
    evaluateMarketplaceHealth(thresholds),
    evaluateCategoryHealth(thresholds),
    evaluateSellerHealth(thresholds),
  ]);

  return {
    marketplace,
    categories: categories.slice(0, 10),
    sellers: sellers.slice(0, 10),
  };
}
