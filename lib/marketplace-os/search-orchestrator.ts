import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { buildMarketplaceZeroResultRecovery } from "@/lib/marketplace-intelligence/zero-result-recovery";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { PriorityAssignment } from "@/lib/marketplace-os/types";

export type SearchOrchestration = {
  rankingRulesApplied: boolean;
  featuredResults: PriorityAssignment[];
  promotedResults: PriorityAssignment[];
  freshResults: { label: string; href: string };
  trendingResults: PriorityAssignment[];
  categorySuggestions: { label: string; href: string }[];
  brandSuggestions: { label: string; href: string }[];
  searchRecoveryEnabled: boolean;
  qualityScore: number;
};

/** Search Orchestrator — coordinates search ranking and recovery. */
export async function orchestrateSearch(
  priorities: PriorityAssignment[],
  thresholds: MosThresholds,
): Promise<SearchOrchestration> {
  const intelThresholds = { ...DEFAULT_THRESHOLDS, minInventory: thresholds.minInventory };
  const searchQuality = await evaluateSearchQuality(intelThresholds);
  const recovery = buildMarketplaceZeroResultRecovery("", 0, intelThresholds);

  return {
    rankingRulesApplied: true,
    featuredResults: priorities.filter((entry) => entry.entityType === "product").slice(0, 6),
    promotedResults: priorities.filter((entry) => entry.reason.includes("featured")).slice(0, 4),
    freshResults: { label: "Recently Listed", href: "/collections/newly-listed" },
    trendingResults: priorities.filter((entry) => entry.reason === "trend_signal").slice(0, 6),
    categorySuggestions: recovery.suggestedCategories.map((entry) => ({ label: entry.label, href: entry.href })),
    brandSuggestions: recovery.suggestedBrands.map((entry) => ({ label: entry.label, href: entry.href })),
    searchRecoveryEnabled: searchQuality.zeroResultRate > 0.1,
    qualityScore: searchQuality.healthScore,
  };
}
