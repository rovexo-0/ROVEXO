import type { Product } from "@/lib/products/types";
import { rankProductsByPopularity } from "@/lib/organic-growth/popularity";
import { buildBuyerRetentionPlan } from "@/lib/organic-growth/buyer-retention";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { detectTrendSignals } from "@/lib/seo/engine/trends";

export type EngagementRecommendation = {
  id: string;
  type:
    | "continue_browsing"
    | "recently_viewed"
    | "similar_products"
    | "recommended_category"
    | "recommended_store"
    | "trending_near"
    | "popular_near"
    | "recent_search"
    | "saved_search"
    | "collection";
  label: string;
  href: string;
  score: number;
};

export type EngagementFeed = {
  generatedAt: string;
  recommendations: EngagementRecommendation[];
  retentionSurfaces: ReturnType<typeof buildBuyerRetentionPlan>["surfaces"];
};

/** User Engagement Engine — surfaces personalized discovery without AI. */
export async function buildEngagementFeed(input?: {
  recentSearches?: string[];
  savedSearches?: string[];
  recentlyViewedProducts?: Product[];
  userCity?: string;
}): Promise<EngagementFeed> {
  const recommendations: EngagementRecommendation[] = [];
  const retention = buildBuyerRetentionPlan({
    hasSavedSearches: (input?.savedSearches?.length ?? 0) > 0,
    hasRecentlyViewed: (input?.recentlyViewedProducts?.length ?? 0) > 0,
  });

  for (const surface of retention.surfaces.slice(0, 4)) {
    recommendations.push({
      id: surface.id,
      type: surface.id as EngagementRecommendation["type"],
      label: surface.label,
      href: surface.href,
      score: surface.priority,
    });
  }

  if (input?.recentlyViewedProducts?.length) {
    const ranked = rankProductsByPopularity(input.recentlyViewedProducts);
    for (const product of ranked.slice(0, 4)) {
      recommendations.push({
        id: `similar-${product.slug}`,
        type: "similar_products",
        label: product.title,
        href: `/listing/${product.slug}`,
        score: 60,
      });
    }
  }

  for (const search of input?.recentSearches?.slice(0, 3) ?? []) {
    recommendations.push({
      id: `recent-search-${search}`,
      type: "recent_search",
      label: search,
      href: `/search?q=${encodeURIComponent(search)}`,
      score: 55,
    });
  }

  for (const search of input?.savedSearches?.slice(0, 3) ?? []) {
    recommendations.push({
      id: `saved-search-${search}`,
      type: "saved_search",
      label: search,
      href: `/search?q=${encodeURIComponent(search)}`,
      score: 65,
    });
  }

  const trends = await detectTrendSignals(8);
  for (const signal of trends) {
    const href =
      signal.type === "brand"
        ? `/brand/${signal.slug}`
        : signal.type === "location"
          ? `/l/${signal.slug}`
          : `/trends/${signal.slug}`;
    recommendations.push({
      id: `trend-${signal.slug}`,
      type: input?.userCity && signal.locationCity === input.userCity ? "trending_near" : "recommended_category",
      label: signal.label,
      href,
      score: signal.score,
    });
  }

  for (const slug of getAllCollectionSlugs().slice(0, 4)) {
    const page = resolveCollectionPage(slug);
    if (page) {
      recommendations.push({
        id: `collection-${slug}`,
        type: "collection",
        label: page.title.replace(/ \| ROVEXO$/, ""),
        href: page.path,
        score: 50,
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);

  return {
    generatedAt: new Date().toISOString(),
    recommendations: recommendations.slice(0, 16),
    retentionSurfaces: retention.surfaces,
  };
}
