import type { Product } from "@/lib/products/types";
import { DEMAND_WEIGHTS } from "@/lib/seo/engine/config";

export type SearchDemandSignals = {
  views: number;
  likes: number;
  orders: number;
  conversionRate: number;
  inventory: number;
  freshnessDays: number;
  isPremium: boolean;
};

export type SearchDemandScore = {
  score: number;
  normalized: number;
  signals: SearchDemandSignals;
  reasons: string[];
};

/** Compute internal search demand from marketplace signals only — no external keyword data. */
export function computeSearchDemand(input: SearchDemandSignals): SearchDemandScore {
  const reasons: string[] = [];
  let score = 0;

  if (input.views > 0) {
    score += Math.log10(input.views + 1) * DEMAND_WEIGHTS.views * 10;
    reasons.push("views");
  }
  if (input.likes > 0) {
    score += Math.log10(input.likes + 1) * DEMAND_WEIGHTS.likes * 10;
    reasons.push("favorites");
  }
  if (input.orders > 0) {
    score += Math.log10(input.orders + 1) * DEMAND_WEIGHTS.orders * 10;
    reasons.push("orders");
  }
  if (input.conversionRate > 0) {
    score += input.conversionRate * DEMAND_WEIGHTS.conversionRate;
    reasons.push("conversion");
  }
  if (input.inventory >= 3) {
    score += Math.min(20, input.inventory * DEMAND_WEIGHTS.inventory);
    reasons.push("inventory");
  }
  if (input.freshnessDays <= 7) {
    score += DEMAND_WEIGHTS.freshness * 2;
    reasons.push("freshness");
  }
  if (input.isPremium) {
    score += DEMAND_WEIGHTS.premium;
    reasons.push("premium");
  }

  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return { score, normalized, signals: input, reasons };
}

export function demandFromProducts(products: Product[], total: number): SearchDemandSignals {
  const views = products.reduce((sum, product) => sum + (product.views ?? 0), 0);
  const likes = products.reduce((sum, product) => sum + (product.likes ?? 0), 0);
  const isPremium = products.some((product) => product.isFeatured || (product.promotionScore ?? 0) > 0);
  const newest = products
    .map((product) => new Date(product.createdAt ?? 0).getTime())
    .filter((time) => time > 0);
  const freshnessDays = newest.length
    ? Math.floor((Date.now() - Math.max(...newest)) / (24 * 60 * 60 * 1000))
    : 999;

  return {
    views,
    likes,
    orders: 0,
    conversionRate: 0,
    inventory: total,
    freshnessDays,
    isPremium,
  };
}

export function meetsDemandThreshold(demand: SearchDemandScore, minNormalized = 15): boolean {
  return demand.normalized >= minNormalized || demand.signals.inventory >= 3;
}

export type HighFrequencySearch = {
  term: string;
  slug: string;
  score: number;
  type: "discovery" | "brand" | "category" | "collection";
};

export type EmergingEntities = {
  brands: string[];
  categories: string[];
  locations: string[];
};

/** Identify high-frequency internal searches from discovery + collection slugs. */
export async function detectHighFrequencySearches(limit = 20): Promise<HighFrequencySearch[]> {
  const { getStaticDiscoverySlugs } = await import("@/lib/seo/engine/discovery");
  const { getAllCollectionSlugs } = await import("@/lib/seo/engine/collections");
  const { detectTrendSignals } = await import("@/lib/seo/engine/trends");

  const trends = await detectTrendSignals(limit);
  const searches: HighFrequencySearch[] = [];

  for (const slug of getStaticDiscoverySlugs().slice(0, limit)) {
    const term = slug.replace(/-/g, " ");
    searches.push({ term, slug, score: 50, type: "discovery" });
  }

  for (const slug of getAllCollectionSlugs().slice(0, Math.floor(limit / 2))) {
    searches.push({
      term: slug.replace(/-/g, " "),
      slug,
      score: 45,
      type: "collection",
    });
  }

  for (const signal of trends.filter((entry) => entry.type === "search" || entry.type === "brand")) {
    searches.push({
      term: signal.label,
      slug: signal.slug,
      score: signal.score,
      type: signal.type === "brand" ? "brand" : "discovery",
    });
  }

  return searches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Detect emerging brands, categories, and locations from live trend signals. */
export async function detectEmergingEntities(): Promise<EmergingEntities> {
  const { detectTrendSignals } = await import("@/lib/seo/engine/trends");
  const trends = await detectTrendSignals(30);

  const brands = trends
    .filter((signal) => signal.type === "brand" && signal.score > 20)
    .slice(0, 10)
    .map((signal) => signal.label);

  const categories = trends
    .filter((signal) => signal.type === "category" && signal.score > 15)
    .slice(0, 10)
    .map((signal) => signal.label);

  const locations = trends
    .filter((signal) => signal.type === "location" && signal.score > 10)
    .slice(0, 10)
    .map((signal) => signal.label);

  return { brands, categories, locations };
}
