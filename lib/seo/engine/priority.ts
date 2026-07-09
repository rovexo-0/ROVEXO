import type { Product } from "@/lib/products/types";
import { PRIORITY, isIndexableInventory } from "@/lib/seo/engine/config";
import type { FreshnessSignals } from "@/lib/seo/engine/freshness";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type IndexPriorityScore = {
  score: number;
  priority: number;
  indexable: boolean;
  reasons: string[];
};

export function computeIndexPriority(
  page: OrganicLandingPage,
  listingCount: number,
  signals?: Partial<FreshnessSignals>,
  productSample?: Product[],
): IndexPriorityScore {
  const reasons: string[] = [];
  let score = 50;

  if (isIndexableInventory(listingCount)) {
    score += 20;
    reasons.push("sufficient_inventory");
  } else {
    score -= 40;
    reasons.push("low_inventory");
  }

  if (page.kind === "category") score += 15;
  if (page.kind === "brand") score += 10;
  if (page.kind === "collection" || page.kind === "trend") score += 8;

  if (signals?.recentlyPublished) {
    score += Math.min(15, signals.recentlyPublished * 3);
    reasons.push("fresh_content");
  }

  const avgViews =
    productSample?.reduce((sum, product) => sum + (product.views ?? 0), 0) ?? 0;
  const avgLikes =
    productSample?.reduce((sum, product) => sum + (product.likes ?? 0), 0) ?? 0;

  if (avgViews > 0) {
    score += Math.min(10, Math.log10(avgViews + 1) * 3);
    reasons.push("popular");
  }
  if (avgLikes > 0) {
    score += Math.min(8, Math.log10(avgLikes + 1) * 2);
    reasons.push("saved_interest");
  }

  const featuredCount = productSample?.filter((product) => product.isFeatured).length ?? 0;
  if (featuredCount > 0) {
    score += 5;
    reasons.push("premium_listings");
  }

  score = Math.max(0, Math.min(100, score));

  let priority: number = PRIORITY.lowValue;
  if (score >= 70) priority = PRIORITY.programmatic;
  if (score >= 85) priority = PRIORITY.category;
  if (!isIndexableInventory(listingCount)) priority = PRIORITY.lowValue;

  return {
    score,
    priority,
    indexable: isIndexableInventory(listingCount),
    reasons,
  };
}
