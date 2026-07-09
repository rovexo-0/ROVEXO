import { PRIORITY } from "@/lib/seo/engine/config";
import type { SeoQualityScore } from "@/lib/seo/engine/quality";
import type { FreshnessSignals } from "@/lib/seo/engine/freshness";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type CrawlBudgetTier = "high" | "medium" | "low" | "minimal";

export type CrawlBudgetAssignment = {
  tier: CrawlBudgetTier;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  reasons: string[];
};

export function assignCrawlBudget(input: {
  page: OrganicLandingPage;
  quality: SeoQualityScore;
  freshness: FreshnessSignals;
}): CrawlBudgetAssignment {
  const reasons: string[] = [];
  let tier: CrawlBudgetTier = "medium";
  let priority: number = PRIORITY.programmatic;
  let changeFrequency: CrawlBudgetAssignment["changeFrequency"] = "weekly";

  const { quality, freshness } = input;

  if (!quality.indexable) {
    return { tier: "minimal", priority: PRIORITY.lowValue, changeFrequency: "monthly", reasons: ["not_indexable"] };
  }

  if (freshness.recentlyPublished >= 3 || freshness.recentlyReduced >= 2) {
    tier = "high";
    priority = PRIORITY.category;
    changeFrequency = "daily";
    reasons.push("fresh_content");
  }

  if (quality.factors.demand >= 50) {
    tier = "high";
    changeFrequency = "daily";
    reasons.push("high_demand");
  }

  if (input.page.kind === "product") {
    priority = PRIORITY.product;
  } else if (input.page.kind === "category") {
    priority = PRIORITY.category;
  } else if (input.page.kind === "collection" || input.page.kind === "trend") {
    priority = PRIORITY.collection;
    if (input.page.slug.includes("trending") || input.page.slug.includes("today")) {
      changeFrequency = "hourly";
      reasons.push("trending");
    }
  }

  if (quality.score < 60) {
    tier = "low";
    priority = PRIORITY.lowValue;
    changeFrequency = "monthly";
    reasons.push("low_quality");
  }

  if (quality.factors.inventory < 30) {
    tier = "low";
    priority = PRIORITY.lowValue;
    reasons.push("low_inventory");
  }

  return { tier, priority, changeFrequency, reasons };
}

/** Scale-ready sitemap chunk index for URL lists exceeding SITEMAP_CHUNK_SIZE. */
export function sitemapChunkId(index: number, chunkSize: number): number {
  return Math.floor(index / chunkSize);
}

export function estimateSitemapChunks(urlCount: number, chunkSize: number): number {
  return Math.max(1, Math.ceil(urlCount / chunkSize));
}
