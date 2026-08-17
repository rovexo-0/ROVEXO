/**
 * ROVEXO Organic Growth Engine v1.0 — Phase 5 measurement layer.
 *
 * Observes certified Phase 1–4 SEO engines. Does not replace them.
 * Does not invent Search Console metrics. Does not mutate pages.
 * No AI. No N+1. No credentials in output.
 */

import type { Ga4EventName } from "@/lib/analytics/ga4-events";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { canonicalForListing } from "@/lib/seo/engine/canonical";
import {
  evaluateListingSeoEligibility,
  evaluateSeoEligibility,
  type SeoEligibilityResult,
} from "@/lib/seo/engine/eligibility";
import { getSearchConsoleConfig } from "@/lib/seo/engine/search-console";
import { getActiveMarket } from "@/lib/seo/markets";
import { sitemapPageTypeForPath } from "@/lib/seo/sitemaps/eligibility-filter";
import type { ProductStatus } from "@/lib/supabase/types/database";

export const ORGANIC_SEO_GROWTH_ENGINE_V1 = "1.0" as const;

/**
 * Explicit Phase 5 thresholds — no GSC CTR/impression constants existed in-repo.
 * Values are weekly page-level Search Console scale, documented in Phase 5 tests.
 */
export const ORGANIC_SEO_THRESHOLDS_V1 = {
  highImpressions: 1000,
  highClicks: 50,
  lowCtr: 0.02,
  highCtr: 0.08,
  goodPosition: 10,
  highConversionRate: 0.03,
  lowConversionRate: 0.005,
} as const;

export type GscConnectionStatus = "CONNECTED" | "NOT_CONNECTED" | "NOT_AVAILABLE";

export type GscConnection = {
  status: GscConnectionStatus;
  reason: string;
  siteUrlConfigured: boolean;
  apiConfigured: boolean;
  metricsAvailable: false | true;
  pingHelperPresent: true;
};

export type SearchPerformanceRecord = {
  url: string;
  pageType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number | null;
  date: string;
  query?: string;
  country?: string;
  device?: string;
};

export type OrganicSearchPerformanceSnapshot = {
  status: GscConnectionStatus;
  reason: string;
  records: SearchPerformanceRecord[];
  generated: boolean;
};

export type OrganicFunnelStep =
  | "organic_visit"
  | "landing_page"
  | "listing_view"
  | "favourite"
  | "offer"
  | "registration"
  | "purchase";

/** Existing GA4 marketplace event names — not a second event engine. */
export const ORGANIC_FUNNEL_EVENT_MAP: Record<Exclude<OrganicFunnelStep, "organic_visit">, readonly Ga4EventName[]> = {
  landing_page: ["page_view"],
  listing_view: ["view_item", "view_listing", "view_listing_hub"],
  favourite: ["add_to_favorites", "save_listing", "watchlist_add"],
  offer: ["make_offer", "offer_sent"],
  registration: ["sign_up", "register"],
  purchase: ["purchase", "checkout_completed"],
};

export type OrganicJourneyEvent = {
  name: string;
  path?: string;
};

export type OrganicAttributionResult = {
  organic: boolean;
  landingPath: string;
  steps: OrganicFunnelStep[];
  reusedExistingEvents: true;
};

export type SeoOpportunityKind =
  | "SEO_OPPORTUNITY"
  | "CTR_OPPORTUNITY"
  | "CONVERSION_OPPORTUNITY"
  | "SEO_WINNER"
  | "EXPANSION_OPPORTUNITY"
  | "INDEXATION_ISSUE";

export type SeoOpportunityPriority = "P0" | "P1" | "P2" | "P3";

export type SeoOpportunity = {
  kind: SeoOpportunityKind;
  priority: SeoOpportunityPriority;
  url: string;
  pageType: string;
  reason: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
};

export type MerchantFeedListingInput = {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  availability?: "in_stock" | "low_stock" | "out_of_stock" | null;
  condition?: string | null;
  imageUrl?: string | null;
  images?: string[];
  brand?: string | null;
  categoryPath?: string[];
  productFound: boolean;
  productStatus?: ProductStatus | null;
  gtin?: string | null;
  mpn?: string | null;
  sku?: string | null;
  sellerEmail?: string | null;
  accountNumber?: string | null;
};

export type MerchantFeedItem = {
  id: string;
  title: string;
  link: string;
  price: string;
  description?: string;
  availability?: "in_stock" | "out_of_stock";
  condition?: "new" | "used" | "refurbished";
  imageLink?: string;
  brand?: string;
  productType?: string;
  gtin?: string;
  mpn?: string;
  sku?: string;
};

export type SeoExperimentStatus = "draft" | "approved" | "running" | "stopped";

export type SeoExperiment = {
  id: string;
  targetPageType: string;
  variant: string;
  startAt: string;
  endAt?: string;
  metric: string;
  status: SeoExperimentStatus;
  optIn: boolean;
  mutatesProduction: boolean;
};

function envPresent(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveGoogleSearchConsoleConnection(): GscConnection {
  const siteUrlConfigured = envPresent("GOOGLE_SEARCH_CONSOLE_SITE_URL");
  const apiConfigured =
    envPresent("GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL") && envPresent("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY");
  getSearchConsoleConfig();

  if (!siteUrlConfigured && !apiConfigured) {
    return {
      status: "NOT_CONNECTED",
      reason: "gsc_credentials_absent",
      siteUrlConfigured: false,
      apiConfigured: false,
      metricsAvailable: false,
      pingHelperPresent: true,
    };
  }

  return {
    status: "NOT_AVAILABLE",
    reason: "gsc_api_client_not_verified",
    siteUrlConfigured,
    apiConfigured,
    metricsAvailable: false,
    pingHelperPresent: true,
  };
}

export function loadOrganicSearchPerformance(): OrganicSearchPerformanceSnapshot {
  const connection = resolveGoogleSearchConsoleConnection();
  return {
    status: connection.status,
    reason: connection.reason,
    records: [],
    generated: false,
  };
}

export function normalizeSearchPerformanceRecord(input: {
  url?: string | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  averagePosition?: number | null;
  date?: string | null;
  query?: string | null;
  country?: string | null;
  device?: string | null;
  pageType?: string | null;
}): SearchPerformanceRecord | null {
  const url = input.url?.trim() ?? "";
  if (!url.startsWith("https://") && !url.startsWith("/")) return null;
  if (typeof input.impressions !== "number" || typeof input.clicks !== "number") return null;
  if (!Number.isFinite(input.impressions) || !Number.isFinite(input.clicks)) return null;
  if (input.impressions < 0 || input.clicks < 0 || input.clicks > input.impressions) return null;
  if (!input.date?.trim()) return null;

  const ctr = input.impressions === 0 ? 0 : input.clicks / input.impressions;
  if (typeof input.ctr === "number" && Number.isFinite(input.ctr) && Math.abs(input.ctr - ctr) > 0.0001) {
    return null;
  }

  const path = url.startsWith("https://") ? new URL(url).pathname : url;
  return {
    url,
    pageType: input.pageType?.trim() || sitemapPageTypeForPath(path),
    impressions: input.impressions,
    clicks: input.clicks,
    ctr,
    averagePosition:
      typeof input.averagePosition === "number" && Number.isFinite(input.averagePosition)
        ? input.averagePosition
        : null,
    date: input.date.trim(),
    ...(input.query?.trim() ? { query: input.query.trim() } : {}),
    ...(input.country?.trim() ? { country: input.country.trim() } : {}),
    ...(input.device?.trim() ? { device: input.device.trim() } : {}),
  };
}

export function aggregateLandingPagePerformance(
  records: SearchPerformanceRecord[],
): Array<SearchPerformanceRecord & { conversions?: number }> {
  const byUrl = new Map<string, SearchPerformanceRecord>();
  for (const record of records) {
    const existing = byUrl.get(record.url);
    if (!existing) {
      byUrl.set(record.url, { ...record });
      continue;
    }
    const impressions = existing.impressions + record.impressions;
    const clicks = existing.clicks + record.clicks;
    byUrl.set(record.url, {
      ...existing,
      impressions,
      clicks,
      ctr: impressions === 0 ? 0 : clicks / impressions,
      averagePosition:
        existing.averagePosition != null && record.averagePosition != null
          ? (existing.averagePosition + record.averagePosition) / 2
          : existing.averagePosition ?? record.averagePosition,
    });
  }
  return [...byUrl.values()];
}

export function isOrganicAcquisition(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
}): boolean {
  const medium = (input.utmMedium ?? "").trim().toLowerCase();
  const source = (input.utmSource ?? "").trim().toLowerCase();
  const referrer = (input.referrer ?? "").trim().toLowerCase();
  if (medium === "cpc" || medium === "paid" || medium === "ppc" || source === "googleads") return false;
  if (medium === "organic") return true;
  if (source === "google" && (medium === "" || medium === "organic")) return true;
  if (referrer.includes("google.") && !referrer.includes("/aclk") && medium !== "cpc") return true;
  return false;
}

function stepForEvent(name: string): Exclude<OrganicFunnelStep, "organic_visit"> | null {
  for (const [step, events] of Object.entries(ORGANIC_FUNNEL_EVENT_MAP) as Array<
    [Exclude<OrganicFunnelStep, "organic_visit">, readonly Ga4EventName[]]
  >) {
    if (events.includes(name as Ga4EventName)) return step;
  }
  return null;
}

export function attributeOrganicJourney(input: {
  acquisition: { utmSource?: string | null; utmMedium?: string | null; referrer?: string | null };
  landingPath: string;
  events: OrganicJourneyEvent[];
}): OrganicAttributionResult {
  const organic = isOrganicAcquisition(input.acquisition);
  const steps: OrganicFunnelStep[] = [];
  if (organic) steps.push("organic_visit");
  if (organic && input.landingPath.trim()) steps.push("landing_page");

  const seen = new Set<OrganicFunnelStep>(steps);
  for (const event of input.events) {
    const step = stepForEvent(event.name);
    if (!step || seen.has(step)) continue;
    seen.add(step);
    steps.push(step);
  }

  return {
    organic,
    landingPath: input.landingPath,
    steps,
    reusedExistingEvents: true,
  };
}

function conversionRate(clicks: number, conversions: number): number {
  if (clicks <= 0) return 0;
  return conversions / clicks;
}

export function detectSeoOpportunities(input: {
  pages: Array<{
    url: string;
    pageType?: string;
    impressions: number;
    clicks: number;
    averagePosition?: number | null;
    conversions?: number;
    eligibility?: SeoEligibilityResult | null;
  }>;
}): SeoOpportunity[] {
  const thresholds = ORGANIC_SEO_THRESHOLDS_V1;
  const opportunities: SeoOpportunity[] = [];

  for (const page of input.pages) {
    const impressions = page.impressions;
    const clicks = page.clicks;
    const conversions = page.conversions ?? 0;
    const ctr = impressions === 0 ? 0 : clicks / impressions;
    const path = page.url.startsWith("https://") ? new URL(page.url).pathname : page.url;
    const pageType = page.pageType ?? sitemapPageTypeForPath(path);
    const rate = conversionRate(clicks, conversions);

    if (page.eligibility && !page.eligibility.eligible) {
      opportunities.push({
        kind: "INDEXATION_ISSUE",
        priority: "P0",
        url: page.url,
        pageType,
        reason: page.eligibility.reason,
        impressions,
        clicks,
        ctr,
        conversions,
      });
      continue;
    }

    const highImpressions = impressions >= thresholds.highImpressions;
    const highClicks = clicks >= thresholds.highClicks;
    const lowCtr = ctr < thresholds.lowCtr;
    const goodPosition =
      typeof page.averagePosition === "number" && page.averagePosition > 0 && page.averagePosition <= thresholds.goodPosition;
    const highConversion = rate >= thresholds.highConversionRate;
    const lowConversion = clicks >= thresholds.highClicks && rate < thresholds.lowConversionRate;

    if (highImpressions && lowCtr) {
      opportunities.push({
        kind: goodPosition ? "CTR_OPPORTUNITY" : "SEO_OPPORTUNITY",
        priority: "P1",
        url: page.url,
        pageType,
        reason: goodPosition ? "good_position_low_ctr" : "high_impressions_low_ctr",
        impressions,
        clicks,
        ctr,
        conversions,
      });
      continue;
    }

    if (highImpressions && clicks < thresholds.highClicks) {
      opportunities.push({
        kind: "CTR_OPPORTUNITY",
        priority: "P1",
        url: page.url,
        pageType,
        reason: "high_impressions_low_clicks",
        impressions,
        clicks,
        ctr,
        conversions,
      });
      continue;
    }

    if (highClicks && lowConversion) {
      opportunities.push({
        kind: "CONVERSION_OPPORTUNITY",
        priority: "P2",
        url: page.url,
        pageType,
        reason: "high_organic_traffic_low_conversion",
        impressions,
        clicks,
        ctr,
        conversions,
      });
      continue;
    }

    if (highClicks && highConversion) {
      opportunities.push({
        kind: "SEO_WINNER",
        priority: "P3",
        url: page.url,
        pageType,
        reason: "high_clicks_high_conversion",
        impressions,
        clicks,
        ctr,
        conversions,
      });
      continue;
    }

    if (highClicks && pageType === "category") {
      opportunities.push({
        kind: "EXPANSION_OPPORTUNITY",
        priority: "P3",
        url: page.url,
        pageType,
        reason: "high_performing_category",
        impressions,
        clicks,
        ctr,
        conversions,
      });
    }
  }

  const rank: Record<SeoOpportunityPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return opportunities.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

function toPublicHttpsFeedLink(url: string): string | null {
  if (url.startsWith("https://")) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

function publicHttpsImage(url: string | null | undefined): string | undefined {
  if (!url || !isRenderableImageSrc(url)) return undefined;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return undefined;
  return trimmed;
}

function merchantCondition(condition?: string | null): MerchantFeedItem["condition"] | undefined {
  if (!condition?.trim()) return undefined;
  const value = condition.trim().toLowerCase();
  if (value === "new") return "new";
  if (value === "refurbished") return "refurbished";
  if (value === "used" || value === "like-new" || value === "good" || value === "fair" || value === "for-parts") {
    return "used";
  }
  return undefined;
}

function optionalPublicAttribute(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function buildMerchantFeedItem(input: MerchantFeedListingInput): MerchantFeedItem | null {
  if (!input.productFound) return null;
  if (isForbiddenMarketplaceSlug(input.slug)) return null;
  if (!Number.isFinite(input.price) || input.price < 0) return null;

  const eligibility = evaluateListingSeoEligibility({
    slug: input.slug,
    productFound: true,
    status: input.productStatus ?? "published",
  });
  if (!eligibility.eligible || eligibility.indexation !== "INDEX") return null;

  const canonical = canonicalForListing(input.slug);
  if (!canonical.valid) return null;
  const link = toPublicHttpsFeedLink(canonical.canonicalUrl);
  if (!link) return null;

  const imageLink =
    publicHttpsImage(input.imageUrl) ?? input.images?.map((image) => publicHttpsImage(image)).find(Boolean);

  const item: MerchantFeedItem = {
    id: input.slug,
    title: input.title,
    link,
    price: `${input.price.toFixed(2)} ${input.currency?.trim() || getActiveMarket().currency}`,
  };

  if (input.description?.trim()) item.description = input.description.trim();
  if (input.availability === "out_of_stock") item.availability = "out_of_stock";
  if (input.availability === "in_stock" || input.availability === "low_stock") item.availability = "in_stock";
  const condition = merchantCondition(input.condition);
  if (condition) item.condition = condition;
  if (imageLink) item.imageLink = imageLink;
  const brand = optionalPublicAttribute(input.brand);
  if (brand) item.brand = brand;
  if (input.categoryPath?.length) item.productType = input.categoryPath.join(" > ");
  const gtin = optionalPublicAttribute(input.gtin);
  const mpn = optionalPublicAttribute(input.mpn);
  const sku = optionalPublicAttribute(input.sku);
  if (gtin) item.gtin = gtin;
  if (mpn) item.mpn = mpn;
  if (sku) item.sku = sku;

  return item;
}

export function buildMerchantFeed(listings: MerchantFeedListingInput[]): {
  items: MerchantFeedItem[];
  excluded: number;
} {
  const items: MerchantFeedItem[] = [];
  const seen = new Set<string>();
  let excluded = 0;

  for (const listing of listings) {
    const item = buildMerchantFeedItem(listing);
    if (!item || seen.has(item.link) || seen.has(item.id)) {
      excluded += 1;
      continue;
    }
    seen.add(item.link);
    seen.add(item.id);
    items.push(item);
  }

  return { items, excluded };
}

export function validateSeoExperiment(experiment: SeoExperiment): { valid: boolean; reason: string } {
  if (!experiment.id.trim() || !experiment.targetPageType.trim() || !experiment.variant.trim()) {
    return { valid: false, reason: "experiment_identity_missing" };
  }
  if (!experiment.optIn) {
    return { valid: false, reason: "experiment_not_opt_in" };
  }
  if (experiment.mutatesProduction) {
    return { valid: false, reason: "production_mutation_forbidden" };
  }
  if (experiment.status === "running" && !experiment.optIn) {
    return { valid: false, reason: "running_requires_opt_in" };
  }
  return { valid: true, reason: "experiment_foundation_only" };
}

export function canApplySeoExperiment(experiment: SeoExperiment): false {
  void experiment;
  return false;
}

export function evaluatePageEligibilityForGrowth(path: string, listingCount?: number): SeoEligibilityResult {
  return evaluateSeoEligibility({
    pageType: sitemapPageTypeForPath(path),
    path,
    listingCount,
  });
}
