import { detectGrowingTrends } from "@/lib/organic-growth/trends";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { PRICE_COLLECTION_TIERS } from "@/lib/seo/engine/config";

export type MarketplaceTrend = {
  label: string;
  href: string;
  score: number;
  type: "product" | "brand" | "category" | "location" | "price" | "collection";
};

/** Trend Engine — detects trending marketplace signals. */
export async function detectMarketplaceTrends(limit = 20): Promise<MarketplaceTrend[]> {
  const trends = await detectGrowingTrends(limit);

  const results: MarketplaceTrend[] = trends.map((signal) => ({
    label: signal.label,
    href: signal.href,
    score: signal.score,
    type: signal.type,
  }));

  for (const slug of getAllCollectionSlugs().filter((entry) => entry.includes("trending")).slice(0, 4)) {
    const page = resolveCollectionPage(slug);
    if (page) {
      results.push({
        label: page.title.replace(/ \| ROVEXO$/, ""),
        href: page.path,
        score: 55,
        type: "collection",
      });
    }
  }

  for (const max of PRICE_COLLECTION_TIERS.slice(0, 3)) {
    results.push({
      label: `Under £${max}`,
      href: `/collections/under-${max}`,
      score: 40,
      type: "price",
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
