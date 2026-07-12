import {
  MIN_DEMAND_FOR_LONG_TAIL,
  MIN_INVENTORY_LONG_TAIL,
  MIN_QUALITY_SCORE_TO_INDEX,
  isFullyIndexable,
} from "@/lib/seo/engine/config";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import type { SearchDemandScore } from "@/lib/seo/engine/search-demand";

export type LongTailExpansionDecision = {
  eligible: boolean;
  indexable: boolean;
  action: "index" | "noindex" | "canonical" | "ignore";
  reason: string;
};

/**
 * Long-Tail Expansion Engine — generates pages only when inventory and
 * quality thresholds are satisfied. Prevents thin/duplicate pages.
 */
export function evaluateLongTailExpansion(input: {
  page: OrganicLandingPage;
  listingCount: number;
  qualityScore: number;
  demand: SearchDemandScore;
  duplicateRisk: number;
}): LongTailExpansionDecision {
  const { page, listingCount, qualityScore, demand, duplicateRisk } = input;

  if (!page) {
    return { eligible: false, indexable: false, action: "ignore", reason: "page_not_found" };
  }

  const isLongTail = page.facetTypes.length >= 2;

  if (!isLongTail) {
    return { eligible: false, indexable: false, action: "ignore", reason: "not_long_tail" };
  }

  if (listingCount < MIN_INVENTORY_LONG_TAIL) {
    return {
      eligible: true,
      indexable: false,
      action: "noindex",
      reason: `inventory_below_${MIN_INVENTORY_LONG_TAIL}`,
    };
  }

  if (qualityScore < MIN_QUALITY_SCORE_TO_INDEX) {
    return {
      eligible: true,
      indexable: false,
      action: "canonical",
      reason: "quality_below_threshold",
    };
  }

  if (demand.normalized < MIN_DEMAND_FOR_LONG_TAIL && listingCount < MIN_INVENTORY_LONG_TAIL + 2) {
    return {
      eligible: true,
      indexable: false,
      action: "noindex",
      reason: "insufficient_demand",
    };
  }

  if (duplicateRisk > 0.3) {
    return {
      eligible: true,
      indexable: false,
      action: "canonical",
      reason: "duplicate_probability_high",
    };
  }

  const indexable = isFullyIndexable(listingCount, qualityScore, true);
  return {
    eligible: true,
    indexable,
    action: indexable ? "index" : "noindex",
    reason: indexable ? "thresholds_met" : "quality_gate_failed",
  };
}
