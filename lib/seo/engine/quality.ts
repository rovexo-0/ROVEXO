import type { Product } from "@/lib/products/types";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import { isFullyIndexable, MIN_QUALITY_SCORE_TO_INDEX } from "@/lib/seo/engine/config";
import type { SearchDemandScore } from "@/lib/seo/engine/search-demand";
import type { FacetEvaluation } from "@/lib/seo/engine/faceted-seo";

export type QualityFactors = {
  inventory: number;
  freshness: number;
  internalLinks: number;
  media: number;
  structuredData: number;
  performance: number;
  duplicateRisk: number;
  demand: number;
};

export type SeoQualityScore = {
  score: number;
  indexable: boolean;
  factors: QualityFactors;
  action: "index" | "noindex" | "canonical" | "redirect";
  reasons: string[];
};

const WEIGHTS = {
  inventory: 0.2,
  freshness: 0.12,
  internalLinks: 0.1,
  media: 0.1,
  structuredData: 0.15,
  performance: 0.13,
  duplicateRisk: 0.1,
  demand: 0.1,
} as const;

export function computeSeoQualityScore(input: {
  page: OrganicLandingPage;
  listingCount: number;
  products: Product[];
  demand: SearchDemandScore;
  facetEvaluation: FacetEvaluation;
  internalLinkCount: number;
  hasStructuredData: boolean;
  duplicateRisk: number;
  performanceScore?: number;
}): SeoQualityScore {
  const reasons: string[] = [];
  const longTail = input.page.facetTypes.length >= 3;

  const inventoryFactor = Math.min(100, (input.listingCount / 10) * 100);
  const freshnessFactor = input.demand.signals.freshnessDays <= 7 ? 90 : input.demand.signals.freshnessDays <= 30 ? 60 : 30;
  const mediaFactor =
    input.products.length > 0
      ? Math.min(100, (input.products.filter((product) => product.imageUrl).length / input.products.length) * 100)
      : 0;
  const structuredDataFactor = input.hasStructuredData ? 95 : 40;
  const performanceFactor = input.performanceScore ?? 90;
  const duplicateFactor = Math.max(0, 100 - input.duplicateRisk * 100);
  const demandFactor = input.demand.normalized;
  const linkFactor = Math.min(100, input.internalLinkCount * 20);

  const factors: QualityFactors = {
    inventory: Math.round(inventoryFactor),
    freshness: Math.round(freshnessFactor),
    internalLinks: Math.round(linkFactor),
    media: Math.round(mediaFactor),
    structuredData: Math.round(structuredDataFactor),
    performance: Math.round(performanceFactor),
    duplicateRisk: Math.round(100 - duplicateFactor),
    demand: Math.round(demandFactor),
  };

  const score = Math.round(
    factors.inventory * WEIGHTS.inventory +
      factors.freshness * WEIGHTS.freshness +
      factors.internalLinks * WEIGHTS.internalLinks +
      factors.media * WEIGHTS.media +
      factors.structuredData * WEIGHTS.structuredData +
      factors.performance * WEIGHTS.performance +
      duplicateFactor * WEIGHTS.duplicateRisk +
      factors.demand * WEIGHTS.demand,
  );

  let action: SeoQualityScore["action"] = "index";
  if (input.facetEvaluation.decision === "canonical") action = "canonical";
  else if (input.facetEvaluation.decision === "noindex" || input.facetEvaluation.decision === "ignore") action = "noindex";
  else if (!isFullyIndexable(input.listingCount, score, longTail)) action = "noindex";

  if (score < MIN_QUALITY_SCORE_TO_INDEX) {
    action = "noindex";
    reasons.push("quality_below_threshold");
  }
  if (input.facetEvaluation.decision !== "index") {
    reasons.push(input.facetEvaluation.reason);
  }
  if (isFullyIndexable(input.listingCount, score, longTail)) {
    reasons.push("meets_quality_and_inventory");
  }

  return {
    score,
    indexable: action === "index" && isFullyIndexable(input.listingCount, score, longTail),
    factors,
    action,
    reasons,
  };
}
