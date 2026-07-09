import type { Product } from "@/lib/products/types";

export type FreshnessSignals = {
  lastUpdated: string;
  recentlyPublished: number;
  recentlyReduced: number;
  recentlyRestocked: number;
};

export function computeListingFreshness(products: Product[]): FreshnessSignals {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  let recentlyPublished = 0;
  let recentlyReduced = 0;
  let recentlyRestocked = 0;
  let latestUpdate = 0;

  for (const product of products) {
    const created = new Date(product.createdAt ?? 0).getTime();
    if (created > latestUpdate) latestUpdate = created;
    if (now - created <= week) recentlyPublished += 1;
    if (product.originalPrice && product.originalPrice > product.price) recentlyReduced += 1;
    if ((product.views ?? 0) > 0 && now - created <= day) recentlyRestocked += 1;
  }

  return {
    lastUpdated: latestUpdate ? new Date(latestUpdate).toISOString() : new Date().toISOString(),
    recentlyPublished,
    recentlyReduced,
    recentlyRestocked,
  };
}

/** Sitemap changeFrequency based on freshness signals. */
export function freshnessChangeFrequency(signals: FreshnessSignals): "always" | "hourly" | "daily" | "weekly" {
  if (signals.recentlyPublished >= 5 || signals.recentlyReduced >= 3) return "daily";
  if (signals.recentlyPublished >= 1) return "weekly";
  return "weekly";
}

export function freshnessPriorityBoost(signals: FreshnessSignals): number {
  return Math.min(
    0.2,
    signals.recentlyPublished * 0.02 + signals.recentlyReduced * 0.03 + signals.recentlyRestocked * 0.01,
  );
}
