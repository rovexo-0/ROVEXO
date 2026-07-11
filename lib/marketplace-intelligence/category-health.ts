import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { clampScore, type IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { CategoryHealthReport } from "@/lib/marketplace-intelligence/types";

/** Category Health Engine — evaluates category liquidity and demand. */
export async function evaluateCategoryHealth(
  thresholds: IntelligenceThresholds,
): Promise<CategoryHealthReport[]> {
  const reports: CategoryHealthReport[] = [];

  try {
    const admin = createAdminClient();
    for (const [alias] of Object.entries(CATEGORY_ALIASES).slice(0, 20)) {
      const searchTerm = alias.replace(/-/g, " ");
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .ilike("title", `%${searchTerm}%`);

      const activeListings = count ?? 0;
      const demandScore = Math.min(100, activeListings * 3 + 20);

      let status: CategoryHealthReport["status"] = "stable";
      if (activeListings < thresholds.lowInventoryThreshold) status = "low_inventory";
      else if (activeListings > thresholds.oversaturatedListingsPerCategory) status = "oversaturated";
      else if (demandScore > 70) status = "growing";
      else if (demandScore < 30) status = "declining";

      const inventoryFactor = Math.min(100, (activeListings / thresholds.minInventory) * 30);
      const demandFactor = demandScore * 0.4;
      const freshnessFactor = 60;
      const score = clampScore(inventoryFactor + demandFactor + freshnessFactor * 0.3);

      reports.push({
        slug: alias,
        name: searchTerm,
        score,
        activeListings,
        status,
        demandScore,
        conversionRate: activeListings > 0 ? 0.02 : 0,
        freshnessDays: 14,
      });
    }
  } catch {
    for (const alias of Object.keys(CATEGORY_ALIASES).slice(0, 10)) {
      reports.push({
        slug: alias,
        name: alias.replace(/-/g, " "),
        score: 50,
        activeListings: 0,
        status: "low_inventory",
        demandScore: 0,
        conversionRate: 0,
        freshnessDays: 999,
      });
    }
  }

  return reports.sort((a, b) => b.score - a.score);
}
