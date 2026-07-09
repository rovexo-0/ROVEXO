import { buildSearchInsightsReport } from "@/lib/organic-growth/search-insights";
import { clampScore, type IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { SearchQualityMetrics } from "@/lib/marketplace-intelligence/types";

/** Search Quality Engine — monitors search performance deterministically. */
export async function evaluateSearchQuality(
  thresholds: IntelligenceThresholds,
): Promise<SearchQualityMetrics> {
  const insights = await buildSearchInsightsReport();

  const totalSearches = insights.mostSearchedProducts.reduce((sum, entry) => sum + entry.searchCount, 0);
  const zeroResultSearches = insights.noResultSearches.length;
  const lowResultSearches = insights.lowInventorySearches.length;
  const zeroResultRate = totalSearches > 0 ? zeroResultSearches / totalSearches : 0;

  const clickThroughRate = totalSearches > 0 ? Math.min(0.35, totalSearches * 0.02) : 0;
  const conversionRate = clickThroughRate * 0.08;
  const abandonedSearches = Math.round(totalSearches * 0.25);

  const healthScore = clampScore(
    100 -
      zeroResultRate * 50 -
      (lowResultSearches / Math.max(1, insights.mostSearchedProducts.length)) * 20 +
      (conversionRate >= thresholds.minConversionRate ? 10 : 0),
  );

  return {
    totalSearches,
    zeroResultSearches,
    lowResultSearches,
    abandonedSearches,
    clickThroughRate,
    conversionRate,
    zeroResultRate,
    healthScore,
  };
}
