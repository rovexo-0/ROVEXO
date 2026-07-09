import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import type { SearchDemandScore } from "@/lib/seo/engine/search-demand";
import type { SeoQualityScore } from "@/lib/seo/engine/quality";

export type LinkPriority = {
  href: string;
  score: number;
};

/** Score a link target for internal link graph optimization. */
export function scoreLinkTarget(
  href: string,
  demand: SearchDemandScore,
  quality: SeoQualityScore,
  freshnessBoost = 0,
): number {
  let score = quality.score * 0.4 + demand.normalized * 0.3 + freshnessBoost;
  if (href.startsWith("/collections/")) score += 5;
  if (href.startsWith("/brand/")) score += 8;
  if (href.startsWith("/discover/")) score += 6;
  if (href.startsWith("/trends/")) score += 10;
  return Math.round(score);
}

/**
 * Internal Link Optimizer — recalculates link priority within groups.
 * Prioritizes high-quality, fresh, high-conversion pages; prevents orphan pages.
 */
export function optimizeInternalLinks(
  groups: InternalLinkGroup[],
  priorities: LinkPriority[] = [],
): InternalLinkGroup[] {
  const priorityMap = new Map(priorities.map((entry) => [entry.href, entry.score]));

  return groups.map((group) => ({
    ...group,
    links: [...group.links].sort((a, b) => {
      const scoreA = priorityMap.get(a.href) ?? defaultLinkScore(a.href);
      const scoreB = priorityMap.get(b.href) ?? defaultLinkScore(b.href);
      return scoreB - scoreA;
    }),
  }));
}

function defaultLinkScore(href: string): number {
  if (href === "/") return 100;
  if (href.startsWith("/category/")) return 70;
  if (href.startsWith("/collections/")) return 65;
  if (href.startsWith("/brand/")) return 75;
  if (href.startsWith("/discover/")) return 60;
  if (href.startsWith("/trends/")) return 80;
  if (href.startsWith("/l/")) return 55;
  return 40;
}

/** Build link priorities from demand + quality for a page context. */
export function buildLinkPrioritiesFromContext(
  groups: InternalLinkGroup[],
  demand: SearchDemandScore,
  quality: SeoQualityScore,
): LinkPriority[] {
  const seen = new Set<string>();
  const priorities: LinkPriority[] = [];

  for (const group of groups) {
    for (const link of group.links) {
      if (seen.has(link.href)) continue;
      seen.add(link.href);
      priorities.push({
        href: link.href,
        score: scoreLinkTarget(link.href, demand, quality),
      });
    }
  }

  return priorities.sort((a, b) => b.score - a.score);
}
