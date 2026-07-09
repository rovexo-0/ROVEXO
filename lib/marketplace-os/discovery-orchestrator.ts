import { buildDiscoveryFeed } from "@/lib/organic-growth/discovery";
import { buildSearchInsightsReport } from "@/lib/organic-growth/search-insights";
import { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { PriorityAssignment } from "@/lib/marketplace-os/types";

export type DiscoveryOrchestration = {
  trending: { label: string; href: string }[];
  collections: { label: string; href: string }[];
  relatedCategories: { label: string; href: string }[];
  relatedStores: { label: string; href: string }[];
  relatedBrands: { label: string; href: string }[];
  popularSearches: string[];
  localDiscovery: { label: string; href: string }[];
};

/** Discovery Orchestrator — optimizes discovery surfaces. */
export async function orchestrateDiscovery(
  priorities: PriorityAssignment[],
  thresholds: MosThresholds,
): Promise<DiscoveryOrchestration> {
  const [feed, insights, trends] = await Promise.all([
    buildDiscoveryFeed(),
    buildSearchInsightsReport(),
    detectMarketplaceTrends(thresholds.discoveryLimit),
  ]);

  return {
    trending: trends.slice(0, 8).map((entry) => ({ label: entry.label, href: entry.href })),
    collections: feed.items.slice(0, thresholds.discoveryLimit).map((item) => ({ label: item.label, href: item.href })),
    relatedCategories: priorities.filter((entry) => entry.entityType === "category").slice(0, 6).map((entry) => ({ label: entry.label, href: entry.href })),
    relatedStores: priorities.filter((entry) => entry.entityType === "store").slice(0, 6).map((entry) => ({ label: entry.label, href: entry.href })),
    relatedBrands: priorities.filter((entry) => entry.entityType === "brand").slice(0, 6).map((entry) => ({ label: entry.label, href: entry.href })),
    popularSearches: insights.mostSearchedProducts.slice(0, 8).map((entry) => entry.term),
    localDiscovery: priorities.filter((entry) => entry.entityType === "location").slice(0, 4).map((entry) => ({ label: entry.label, href: entry.href })),
  };
}
