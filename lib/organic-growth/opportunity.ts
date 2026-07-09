import { createAdminClient } from "@/lib/supabase/admin";
import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { getStaticDiscoverySlugs } from "@/lib/seo/engine/discovery";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { OPPORTUNITY_THRESHOLDS, isCollectionPublishable } from "@/lib/organic-growth/config";
import { buildSearchInsightsReport } from "@/lib/organic-growth/search-insights";

export type GrowthOpportunity = {
  id: string;
  type:
    | "new_collection"
    | "brand_landing"
    | "city_discovery"
    | "search_demand_gap"
    | "category_promotion"
    | "featured_store";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionPath?: string;
  metric?: string;
};

/** Opportunity Engine — detects growth opportunities from marketplace signals. */
export async function detectGrowthOpportunities(limit = 20): Promise<GrowthOpportunity[]> {
  const opportunities: GrowthOpportunity[] = [];
  const [trends, insights] = await Promise.all([detectTrendSignals(30), buildSearchInsightsReport()]);

  for (const signal of trends.filter((entry) => entry.type === "category")) {
    opportunities.push({
      id: `cat-promo-${signal.slug}`,
      type: "category_promotion",
      title: `Promote ${signal.label}`,
      description: `Category "${signal.label}" is growing fast (score ${signal.score}). Consider homepage promotion.`,
      priority: signal.score > 50 ? "high" : "medium",
      actionPath: signal.categorySlugPath ? `/category/${signal.categorySlugPath.join("/")}` : undefined,
      metric: `score:${signal.score}`,
    });
  }

  for (const signal of trends.filter((entry) => entry.type === "brand")) {
    if (signal.score >= OPPORTUNITY_THRESHOLDS.brandLandingMinListings) {
      opportunities.push({
        id: `brand-landing-${signal.slug}`,
        type: "brand_landing",
        title: `Brand landing page: ${signal.label}`,
        description: `${signal.label} qualifies for a dedicated brand discovery page.`,
        priority: signal.score > 40 ? "high" : "medium",
        actionPath: `/brand/${signal.slug}`,
        metric: `score:${signal.score}`,
      });
    }
  }

  for (const signal of trends.filter((entry) => entry.type === "location")) {
    if (signal.score >= OPPORTUNITY_THRESHOLDS.cityDiscoveryMinListings) {
      opportunities.push({
        id: `city-discovery-${signal.slug}`,
        type: "city_discovery",
        title: `Local discovery: ${signal.label}`,
        description: `${signal.label} has growing local demand. Local discovery page recommended.`,
        priority: "medium",
        actionPath: `/l/${signal.slug}`,
        metric: `score:${signal.score}`,
      });
    }
  }

  for (const entry of insights.noResultSearches.slice(0, 5)) {
    opportunities.push({
      id: `demand-gap-${entry.term.replace(/\s+/g, "-")}`,
      type: "search_demand_gap",
      title: `Demand gap: "${entry.term}"`,
      description: `${entry.searchCount} searches with no inventory. Recruit sellers or expand category coverage.`,
      priority: entry.searchCount > 5 ? "high" : "medium",
      actionPath: `/search?q=${encodeURIComponent(entry.term)}`,
      metric: `searches:${entry.searchCount}`,
    });
  }

  for (const [alias, slugs] of Object.entries(CATEGORY_ALIASES).slice(0, 8)) {
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .ilike("title", `%${alias.replace(/-/g, " ")}%`);
      const listingCount = count ?? 0;
      if (listingCount >= OPPORTUNITY_THRESHOLDS.categoryCollectionMinListings) {
        const collectionSlug = `${alias}-deals`;
        if (!getAllCollectionSlugs().includes(collectionSlug)) {
          opportunities.push({
            id: `new-collection-${alias}`,
            type: "new_collection",
            title: `New collection: ${alias.replace(/-/g, " ")} deals`,
            description: `${listingCount} listings qualify for an auto-generated "${alias}" collection.`,
            priority: listingCount > 20 ? "high" : "medium",
            actionPath: `/collections/best-deals`,
            metric: `listings:${listingCount}`,
          });
        }
      }
    } catch {
      // Skip on DB error
    }
  }

  for (const location of ALL_UK_LOCATIONS.slice(0, 5)) {
    opportunities.push({
      id: `featured-store-${location.slug}`,
      type: "featured_store",
      title: `Featured stores in ${location.name}`,
      description: `Evaluate top stores in ${location.name} for featured status.`,
      priority: "low",
      actionPath: `/l/${location.slug}`,
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, limit);
}

export function evaluateCollectionOpportunity(slug: string, listingCount: number, qualityScore: number): GrowthOpportunity | null {
  if (!isCollectionPublishable(listingCount, qualityScore)) return null;
  const page = resolveCollectionPage(slug);
  if (!page) return null;
  return {
    id: `publish-collection-${slug}`,
    type: "new_collection",
    title: `Publish collection: ${page.title.replace(/ \| ROVEXO$/, "")}`,
    description: `${listingCount} listings meet quality thresholds for this collection.`,
    priority: listingCount > 10 ? "high" : "medium",
    actionPath: page.path,
    metric: `listings:${listingCount}`,
  };
}

export function countActiveDiscoveryPages(): number {
  return getStaticDiscoverySlugs().length;
}
