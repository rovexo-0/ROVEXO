import type { Product } from "@/lib/products/types";
import { computePopularityScore, popularityFromProduct } from "@/lib/organic-growth/popularity";
import { computeHomepagePriorityScore } from "@/lib/homepage/feed-ranking";
import { clampScore, resolveRankingWeights, type RankingWeights } from "@/lib/marketplace-intelligence/config";
import { evaluateProductListingQuality } from "@/lib/marketplace-intelligence/listing-quality";
import type { IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";

export type RankingScore = {
  productId: string;
  slug: string;
  score: number;
  factors: Record<string, number>;
};

/** Ranking Engine — deterministic marketplace ranking. No random ordering. */
export function computeProductRankingScore(
  product: Product & { stock?: number },
  thresholds: IntelligenceThresholds,
  weights: RankingWeights = resolveRankingWeights(),
): RankingScore {
  const popularity = computePopularityScore(popularityFromProduct(product));
  const listingQuality = evaluateProductListingQuality(product, thresholds);
  const homepagePriority = computeHomepagePriorityScore(product);

  const created = new Date(product.createdAt ?? 0).getTime();
  const freshnessDays =
    created > 0 ? Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000)) : 999;
  const freshnessFactor = freshnessDays <= 7 ? 100 : freshnessDays <= 30 ? 60 : 30;

  const factors = {
    freshness: freshnessFactor * (weights.freshness / 100),
    views: Math.min(100, (product.views ?? 0) / 2) * (weights.views / 100),
    favorites: Math.min(100, (product.likes ?? 0) * 5) * (weights.favorites / 100),
    conversion: popularity.signals.purchases * (weights.conversion / 100),
    sellerQuality: (product.sellerVerified ? 80 : 40) * (weights.sellerQuality / 100),
    listingCompleteness: listingQuality.completeness * (weights.listingCompleteness / 100),
    verifiedStatus: (product.sellerVerified ? 100 : 0) * (weights.verifiedStatus / 100),
    inventoryAvailability: ((product.stock ?? 1) > 0 ? 100 : 0) * (weights.inventoryAvailability / 100),
    homepagePriority: homepagePriority * 0.5,
  };

  const score = clampScore(Object.values(factors).reduce((sum, value) => sum + value, 0));

  return {
    productId: product.id,
    slug: product.slug,
    score,
    factors,
  };
}

export function rankProducts(
  products: Product[],
  thresholds: IntelligenceThresholds,
  weights?: RankingWeights,
): Product[] {
  return [...products].sort((a, b) => {
    const scoreA = computeProductRankingScore(a, thresholds, weights).score;
    const scoreB = computeProductRankingScore(b, thresholds, weights).score;
    return scoreB - scoreA;
  });
}
