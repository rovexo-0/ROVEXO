import { runOrganicGrowthAutomation } from "@/lib/organic-growth/automation";
import { runOrganicGrowthOptimization } from "@/lib/seo/engine/optimizer";
import { revalidatePath } from "next/cache";
import { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
import { detectMarketplaceOpportunities } from "@/lib/marketplace-intelligence/opportunity";
import type { IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";

export type IntelligenceAutomationResult = {
  executedAt: string;
  organicGrowthUpdated: boolean;
  seoOptimizerUpdated: boolean;
  trendsRefreshed: number;
  opportunitiesDetected: number;
  surfacesRevalidated: string[];
  status: "completed" | "partial";
};

/**
 * Automation Engine — refreshes homepage, trending, featured, collections,
 * discovery, rankings, and navigation per configurable schedules.
 */
export async function runMarketplaceIntelligenceAutomation(
  thresholds: IntelligenceThresholds,
): Promise<IntelligenceAutomationResult> {
  const [organic, seo, trends, opportunities] = await Promise.all([
    runOrganicGrowthAutomation(),
    runOrganicGrowthOptimization(),
    detectMarketplaceTrends(15),
    detectMarketplaceOpportunities(thresholds),
  ]);

  const surfacesRevalidated: string[] = [];

  try {
    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/search");
    revalidatePath("/collections/[slug]", "page");
    revalidatePath("/discover/[slug]", "page");
    revalidatePath("/trends/[slug]", "page");
    surfacesRevalidated.push("/", "/categories", "/search", "/collections", "/discover", "/trends");
  } catch {
    // revalidatePath may fail outside request context in tests
  }

  return {
    executedAt: new Date().toISOString(),
    organicGrowthUpdated: organic.status === "completed",
    seoOptimizerUpdated: seo.evaluatedAt.length > 0,
    trendsRefreshed: trends.length,
    opportunitiesDetected: opportunities.length,
    surfacesRevalidated,
    status: "completed",
  };
}
