import { MIN_INVENTORY_TO_INDEX } from "@/lib/seo/engine/config";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { getStaticDiscoverySlugs, resolveDiscoveryPage } from "@/lib/seo/engine/discovery";
import { getLongTailSlugCandidates } from "@/lib/seo/engine/long-tail";
import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { detectEmergingEntities, detectHighFrequencySearches } from "@/lib/seo/engine/search-demand";
import { buildOrganicGrowthContext } from "@/lib/seo/engine/platform";
import { optimizeInternalLinks } from "@/lib/seo/engine/link-optimizer";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";

export type OrganicGrowthOptimizationResult = {
  evaluatedAt: string;
  indexableDiscoverySlugs: string[];
  noindexDiscoverySlugs: string[];
  indexableCollectionSlugs: string[];
  emergingBrands: string[];
  emergingCategories: string[];
  emergingLocations: string[];
  highFrequencySearches: string[];
  fastGrowingSearches: string[];
  recommendedLinkPriorities: { href: string; label: string; score: number }[];
};

/**
 * Organic Growth Optimizer — evaluates marketplace signals and updates
 * discovery/index/link recommendations deterministically.
 * Invoked on listing publish, health refresh, and deployment regression.
 */
export async function runOrganicGrowthOptimization(): Promise<OrganicGrowthOptimizationResult> {
  const [trends, emerging, searches] = await Promise.all([
    detectTrendSignals(30),
    detectEmergingEntities(),
    detectHighFrequencySearches(15),
  ]);

  const indexableDiscoverySlugs: string[] = [];
  const noindexDiscoverySlugs: string[] = [];
  const indexableCollectionSlugs: string[] = [];
  const recommendedLinkPriorities: { href: string; label: string; score: number }[] = [];

  for (const slug of getStaticDiscoverySlugs().slice(0, 100)) {
    const page = resolveDiscoveryPage(slug);
    if (!page) continue;
    const ctx = buildOrganicGrowthContext(page, [], 0);
    if (ctx.indexable) indexableDiscoverySlugs.push(slug);
    else noindexDiscoverySlugs.push(slug);
  }

  for (const slug of getAllCollectionSlugs()) {
    const page = resolveCollectionPage(slug);
    if (!page) continue;
    const ctx = buildOrganicGrowthContext(page, [], MIN_INVENTORY_TO_INDEX);
    if (ctx.indexable) indexableCollectionSlugs.push(slug);
  }

  for (const slug of getLongTailSlugCandidates(20)) {
    const page = resolveDiscoveryPage(slug);
    if (page) {
      const ctx = buildOrganicGrowthContext(page, [], 0);
      if (!ctx.indexable) noindexDiscoverySlugs.push(slug);
    }
  }

  for (const signal of trends.slice(0, 10)) {
    recommendedLinkPriorities.push({
      href: signal.type === "brand" ? `/brand/${signal.slug}` : `/trends/${signal.slug}`,
      label: signal.label,
      score: signal.score,
    });
  }

  for (const search of searches.slice(0, 8)) {
    recommendedLinkPriorities.push({
      href: `/discover/${search.slug}`,
      label: search.term,
      score: search.score,
    });
  }

  recommendedLinkPriorities.sort((a, b) => b.score - a.score);

  return {
    evaluatedAt: new Date().toISOString(),
    indexableDiscoverySlugs,
    noindexDiscoverySlugs,
    indexableCollectionSlugs,
    emergingBrands: emerging.brands,
    emergingCategories: emerging.categories,
    emergingLocations: emerging.locations,
    highFrequencySearches: searches.map((entry) => entry.term),
    fastGrowingSearches: trends.filter((signal) => signal.score > 50).map((signal) => signal.label),
    recommendedLinkPriorities: recommendedLinkPriorities.slice(0, 20),
  };
}

/** Apply optimizer link priorities to a page's internal link groups. */
export function applyOptimizedLinks(
  groups: InternalLinkGroup[],
  priorities: { href: string; score: number }[],
): InternalLinkGroup[] {
  return optimizeInternalLinks(groups, priorities);
}
