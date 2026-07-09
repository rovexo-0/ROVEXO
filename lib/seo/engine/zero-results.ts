import { isIndexableInventory, MIN_INVENTORY_TO_INDEX } from "@/lib/seo/engine/config";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type ZeroResultDecision = {
  indexable: boolean;
  action: "index" | "noindex" | "redirect" | "canonical";
  targetPath?: string;
  reason: string;
};

export function evaluateZeroResults(
  page: OrganicLandingPage,
  listingCount: number,
): ZeroResultDecision {
  if (isIndexableInventory(listingCount)) {
    return { indexable: true, action: "index", reason: "sufficient_inventory" };
  }

  if (listingCount === 0) {
    if (page.search.categorySlugPath?.length) {
      return {
        indexable: false,
        action: "canonical",
        targetPath: `/category/${page.search.categorySlugPath.join("/")}`,
        reason: "zero_listings_canonical_to_category",
      };
    }
    if (page.search.brand) {
      return {
        indexable: false,
        action: "redirect",
        targetPath: `/search?q=${encodeURIComponent(page.search.brand)}&brand=${encodeURIComponent(page.search.brand)}`,
        reason: "zero_listings_redirect_to_search",
      };
    }
    return { indexable: false, action: "noindex", reason: "zero_listings" };
  }

  return {
    indexable: false,
    action: "noindex",
    reason: `below_threshold_${listingCount}_of_${MIN_INVENTORY_TO_INDEX}`,
  };
}
