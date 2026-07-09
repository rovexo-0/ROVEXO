import type { OrganicLandingPage, ProgrammaticFacet } from "@/lib/seo/engine/types";
import type { FacetIndexDecision } from "@/lib/seo/engine/config";
import { isIndexableInventory, MIN_INVENTORY_TO_INDEX } from "@/lib/seo/engine/config";
import type { SearchDemandScore } from "@/lib/seo/engine/search-demand";

export type FacetEvaluationInput = {
  page: OrganicLandingPage;
  listingCount: number;
  demand: SearchDemandScore;
  qualityScore: number;
  duplicateRisk: number;
  internalLinkCount: number;
};

export type FacetEvaluation = {
  decision: FacetIndexDecision;
  canonicalTarget?: string;
  reason: string;
};

function facetCount(facetTypes: ProgrammaticFacet[]): number {
  return facetTypes.length;
}

/** Evaluate whether a faceted URL should be indexed, canonicalized, or ignored. */
export function evaluateFacetIndexing(input: FacetEvaluationInput): FacetEvaluation {
  const { page, listingCount, demand, qualityScore, duplicateRisk, internalLinkCount } = input;
  const facets = facetCount(page.facetTypes);
  const longTail = facets >= 3;

  if (listingCount === 0) {
    if (page.search.categorySlugPath?.length) {
      return {
        decision: "canonical",
        canonicalTarget: `/category/${page.search.categorySlugPath.join("/")}`,
        reason: "zero_inventory_canonical_category",
      };
    }
    return { decision: "noindex", reason: "zero_inventory" };
  }

  if (!isIndexableInventory(listingCount, longTail)) {
    return { decision: "noindex", reason: `inventory_${listingCount}_below_${longTail ? 5 : MIN_INVENTORY_TO_INDEX}` };
  }

  if (duplicateRisk >= 0.85) {
    if (page.canonicalPath) {
      return { decision: "canonical", canonicalTarget: page.canonicalPath, reason: "duplicate_risk" };
    }
    return { decision: "noindex", reason: "duplicate_risk" };
  }

  if (qualityScore < 55) {
    return { decision: "noindex", reason: "quality_below_threshold" };
  }

  if (facets >= 4 && demand.normalized < 20) {
    return { decision: "ignore", reason: "high_facet_low_demand" };
  }

  if (facets >= 2 && internalLinkCount < 2 && listingCount < 5) {
    return {
      decision: "canonical",
      canonicalTarget: page.canonicalPath ?? page.breadcrumbs[page.breadcrumbs.length - 2]?.href,
      reason: "thin_facet_canonical",
    };
  }

  if (demand.normalized >= 30 || listingCount >= MIN_INVENTORY_TO_INDEX * 2) {
    return { decision: "index", reason: "sufficient_demand_and_inventory" };
  }

  return { decision: "index", reason: "default_indexable" };
}

/** Search filter URL params — prevent crawl waste on over-filtered search. */
export function evaluateSearchFacetDecision(params: URLSearchParams): FacetIndexDecision {
  const keys = ["q", "brand", "condition", "minPrice", "maxPrice", "location", "sort", "page"];
  let active = 0;
  for (const key of keys) {
    if (params.get(key)) active += 1;
  }
  if (active === 0) return "index";
  if (params.get("q")) return "noindex";
  if (active > 2) return "noindex";
  return "noindex";
}
