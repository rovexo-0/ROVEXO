import { runOrganicGrowthOptimization } from "@/lib/seo/engine/optimizer";
import { buildDiscoveryFeed } from "@/lib/organic-growth/discovery";
import { detectGrowingTrends } from "@/lib/organic-growth/trends";
import { buildSearchInsightsReport } from "@/lib/organic-growth/search-insights";
import { detectGrowthOpportunities } from "@/lib/organic-growth/opportunity";
import { buildSellerGrowthReport } from "@/lib/organic-growth/seller-growth";
import { buildEngagementFeed } from "@/lib/organic-growth/engagement";

export type AutomationRunResult = {
  executedAt: string;
  discoveryUpdated: number;
  trendsUpdated: number;
  collectionsEvaluated: number;
  opportunitiesDetected: number;
  linkPrioritiesUpdated: number;
  engagementSurfaces: number;
  status: "completed" | "partial";
};

/**
 * Automation Engine — continuously updates trending, popular, collections,
 * discovery pages, internal links, and priority rankings. No manual intervention.
 */
export async function runOrganicGrowthAutomation(): Promise<AutomationRunResult> {
  const [discovery, trends, insights, opportunities, sellerGrowth, seoOptimization, engagement] =
    await Promise.all([
      buildDiscoveryFeed(),
      detectGrowingTrends(20),
      buildSearchInsightsReport(),
      detectGrowthOpportunities(15),
      buildSellerGrowthReport(),
      runOrganicGrowthOptimization(),
      buildEngagementFeed(),
    ]);

  return {
    executedAt: new Date().toISOString(),
    discoveryUpdated: discovery.items.length,
    trendsUpdated: trends.length,
    collectionsEvaluated: seoOptimization.indexableCollectionSlugs.length,
    opportunitiesDetected: opportunities.length,
    linkPrioritiesUpdated: seoOptimization.recommendedLinkPriorities.length,
    engagementSurfaces: engagement.recommendations.length,
    status: "completed",
  };
}
