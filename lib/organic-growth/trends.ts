import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { isTrendExpired } from "@/lib/seo/engine/trends";
import { TREND_EXPIRY_DAYS } from "@/lib/organic-growth/config";

export type TrendGrowthSignal = {
  slug: string;
  label: string;
  type: "category" | "brand" | "location" | "product" | "price" | "collection";
  score: number;
  growthRate: number;
  href: string;
  active: boolean;
};

/** Trend Engine — detects and promotes growing marketplace signals. */
export async function detectGrowingTrends(limit = 20): Promise<TrendGrowthSignal[]> {
  const signals = await detectTrendSignals(limit * 2);
  const results: TrendGrowthSignal[] = [];

  for (const signal of signals) {
    const href =
      signal.type === "brand"
        ? `/brand/${signal.slug}`
        : signal.type === "location"
          ? `/l/${signal.slug}`
          : signal.type === "category"
            ? `/category/${signal.slug}`
            : `/trends/${signal.slug}`;

    results.push({
      slug: signal.slug,
      label: signal.label,
      type: signal.type === "search" ? "product" : signal.type,
      score: signal.score,
      growthRate: Math.min(100, Math.round(signal.score / 2)),
      href,
      active: signal.score > 5,
    });
  }

  return results.filter((entry) => entry.active).slice(0, limit);
}

export function filterExpiredTrends(
  trends: TrendGrowthSignal[],
  lastModifiedMap: Record<string, string>,
): { active: TrendGrowthSignal[]; expired: string[] } {
  const active: TrendGrowthSignal[] = [];
  const expired: string[] = [];

  for (const trend of trends) {
    const lastModified = lastModifiedMap[trend.slug];
    if (lastModified && isTrendExpired(lastModified)) {
      expired.push(trend.slug);
    } else {
      active.push(trend);
    }
  }

  return { active, expired };
}

export function trendTtlDays(): number {
  return TREND_EXPIRY_DAYS;
}
