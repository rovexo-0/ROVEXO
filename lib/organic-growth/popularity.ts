import type { Product } from "@/lib/products/types";
import { POPULARITY_WEIGHTS } from "@/lib/organic-growth/config";

export type PopularitySignals = {
  views: number;
  favorites: number;
  shares: number;
  purchases: number;
  conversionRate: number;
  freshnessDays: number;
  isVerifiedSeller: boolean;
  isPremium: boolean;
  recentActivityScore: number;
};

export type PopularityScore = {
  score: number;
  normalized: number;
  signals: PopularitySignals;
  reasons: string[];
};

export function popularityFromProduct(product: Product): PopularitySignals {
  const created = new Date(product.createdAt ?? 0).getTime();
  const freshnessDays =
    created > 0 ? Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000)) : 999;

  return {
    views: product.views ?? 0,
    favorites: product.likes ?? 0,
    shares: 0,
    purchases: 0,
    conversionRate: 0,
    freshnessDays,
    isVerifiedSeller: product.sellerVerified ?? false,
    isPremium: product.isFeatured || (product.promotionScore ?? 0) > 0,
    recentActivityScore: freshnessDays <= 7 ? 100 : freshnessDays <= 30 ? 60 : 20,
  };
}

/** Popularity Engine — deterministic ranking from first-party marketplace signals. */
export function computePopularityScore(signals: PopularitySignals): PopularityScore {
  const reasons: string[] = [];
  let score = 0;

  if (signals.views > 0) {
    score += Math.log10(signals.views + 1) * POPULARITY_WEIGHTS.views * 10;
    reasons.push("views");
  }
  if (signals.favorites > 0) {
    score += Math.log10(signals.favorites + 1) * POPULARITY_WEIGHTS.favorites * 10;
    reasons.push("favorites");
  }
  if (signals.shares > 0) {
    score += Math.log10(signals.shares + 1) * POPULARITY_WEIGHTS.shares * 10;
    reasons.push("shares");
  }
  if (signals.purchases > 0) {
    score += Math.log10(signals.purchases + 1) * POPULARITY_WEIGHTS.purchases * 10;
    reasons.push("purchases");
  }
  if (signals.conversionRate > 0) {
    score += signals.conversionRate * POPULARITY_WEIGHTS.conversionRate;
    reasons.push("conversion");
  }
  if (signals.recentActivityScore > 0) {
    score += (signals.recentActivityScore / 100) * POPULARITY_WEIGHTS.recentActivity * 5;
    reasons.push("recent_activity");
  }
  if (signals.freshnessDays <= 7) {
    score += POPULARITY_WEIGHTS.freshness * 2;
    reasons.push("freshness");
  }
  if (signals.isVerifiedSeller) {
    score += POPULARITY_WEIGHTS.verifiedSeller;
    reasons.push("verified_seller");
  }
  if (signals.isPremium) {
    score += POPULARITY_WEIGHTS.premium;
    reasons.push("premium");
  }

  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return { score, normalized, signals, reasons };
}

export function rankProductsByPopularity(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const scoreA = computePopularityScore(popularityFromProduct(a)).normalized;
    const scoreB = computePopularityScore(popularityFromProduct(b)).normalized;
    return scoreB - scoreA;
  });
}

export function aggregatePopularity(products: Product[]): PopularityScore {
  const totals = products.reduce<PopularitySignals>(
    (acc, product) => {
      const signals = popularityFromProduct(product);
      acc.views += signals.views;
      acc.favorites += signals.favorites;
      acc.shares += signals.shares;
      acc.purchases += signals.purchases;
      acc.recentActivityScore = Math.max(acc.recentActivityScore, signals.recentActivityScore);
      if (signals.isVerifiedSeller) acc.isVerifiedSeller = true;
      if (signals.isPremium) acc.isPremium = true;
      acc.freshnessDays = Math.min(acc.freshnessDays, signals.freshnessDays);
      return acc;
    },
    {
      views: 0,
      favorites: 0,
      shares: 0,
      purchases: 0,
      conversionRate: 0,
      freshnessDays: 999,
      isVerifiedSeller: false,
      isPremium: false,
      recentActivityScore: 0,
    },
  );

  return computePopularityScore(totals);
}
