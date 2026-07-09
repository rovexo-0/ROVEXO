import { buildDiscoveryFeed } from "@/lib/organic-growth/discovery";
import { buildEngagementFeed } from "@/lib/organic-growth/engagement";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { PriorityAssignment } from "@/lib/marketplace-os/types";

export type HomepageOrchestration = {
  heroBanner: { label: string; href: string } | null;
  trending: PriorityAssignment[];
  featured: PriorityAssignment[];
  popular: PriorityAssignment[];
  newListings: { label: string; href: string };
  collections: { label: string; href: string }[];
  brands: PriorityAssignment[];
  stores: PriorityAssignment[];
  seasonal: { label: string; href: string }[];
  recommendations: { label: string; href: string; score: number }[];
};

/** Homepage Orchestrator — organizes homepage blocks by priority. */
export async function orchestrateHomepage(
  priorities: PriorityAssignment[],
  thresholds: MosThresholds,
): Promise<HomepageOrchestration> {
  const [discovery, engagement] = await Promise.all([
    buildDiscoveryFeed(),
    buildEngagementFeed(),
  ]);

  const trending = priorities.filter((entry) => entry.reason === "trend_signal").slice(0, 6);
  const featured = priorities.filter((entry) => entry.reason.includes("featured") || entry.reason === "top_seller").slice(0, thresholds.homepageSlots);
  const popular = discovery.items.filter((item) => item.category === "popular").slice(0, 6).map((item) => ({
    entityType: "collection" as const,
    entityId: item.slug,
    label: item.label,
    href: item.href,
    priority: 60,
    reason: "popular_collection",
  }));
  const brands = priorities.filter((entry) => entry.entityType === "brand").slice(0, 4);
  const stores = priorities.filter((entry) => entry.entityType === "store").slice(0, 4);
  const seasonal = discovery.items.filter((item) => item.category === "seasonal").slice(0, 4).map((item) => ({
    label: item.label,
    href: item.href,
  }));

  return {
    heroBanner: trending[0] ? { label: trending[0].label, href: trending[0].href } : { label: "Discover ROVEXO", href: "/categories" },
    trending,
    featured,
    popular,
    newListings: { label: "Newly Listed", href: "/collections/newly-listed" },
    collections: discovery.items.slice(0, thresholds.homepageSlots).map((item) => ({ label: item.label, href: item.href })),
    brands,
    stores,
    seasonal,
    recommendations: engagement.recommendations.slice(0, 8).map((entry) => ({
      label: entry.label,
      href: entry.href,
      score: entry.score,
    })),
  };
}
