import { describe, expect, it } from "vitest";
import { trackPurchase, trackSaveListing, trackViewListing } from "@/lib/analytics/marketplace-events";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import { canonicalForListing } from "@/lib/seo/ssot";
import { evaluateListingSeoEligibility } from "@/lib/seo/engine/eligibility";
import {
  ORGANIC_FUNNEL_EVENT_MAP,
  ORGANIC_SEO_THRESHOLDS_V1,
  aggregateLandingPagePerformance,
  attributeOrganicJourney,
  buildMerchantFeed,
  buildMerchantFeedItem,
  canApplySeoExperiment,
  detectSeoOpportunities,
  isOrganicAcquisition,
  loadOrganicSearchPerformance,
  normalizeSearchPerformanceRecord,
  resolveGoogleSearchConsoleConnection,
  validateSeoExperiment,
  type MerchantFeedListingInput,
  type SeoExperiment,
} from "@/lib/seo/organic-growth-engine-v1";

function listing(overrides: Partial<MerchantFeedListingInput> = {}): MerchantFeedListingInput {
  return {
    slug: "nike-air-max",
    title: "Nike Air Max",
    description: "Genuine pair in excellent condition.",
    price: 90,
    currency: "GBP",
    availability: "in_stock",
    condition: "new",
    imageUrl: "https://cdn.example/nike.jpg",
    brand: "Nike",
    categoryPath: ["womens-fashion", "shoes"],
    productFound: true,
    productStatus: "published",
    ...overrides,
  };
}

function experiment(overrides: Partial<SeoExperiment> = {}): SeoExperiment {
  return {
    id: "seo-exp-title-ctr-1",
    targetPageType: "category",
    variant: "control",
    startAt: "2026-08-17T00:00:00.000Z",
    metric: "ctr",
    status: "draft",
    optIn: true,
    mutatesProduction: false,
    ...overrides,
  };
}

describe("SEO Phase 5 — Organic Growth Engine", () => {
  it("returns NOT_CONNECTED or NOT_AVAILABLE and does not invent GSC metrics", () => {
    const connection = resolveGoogleSearchConsoleConnection();
    expect(["NOT_CONNECTED", "NOT_AVAILABLE"]).toContain(connection.status);
    expect(connection.metricsAvailable).toBe(false);
    expect(JSON.stringify(connection)).not.toContain("PRIVATE_KEY");
    expect(JSON.stringify(connection)).not.toContain("BEGIN");

    const snapshot = loadOrganicSearchPerformance();
    expect(["NOT_CONNECTED", "NOT_AVAILABLE"]).toContain(snapshot.status);
    expect(snapshot.generated).toBe(false);
    expect(snapshot.records).toEqual([]);
  });

  it("normalizes a valid performance record and rejects incomplete or contradictory metrics", () => {
    const valid = normalizeSearchPerformanceRecord({
      url: "https://www.rovexo.co.uk/category/womens-fashion",
      impressions: 2000,
      clicks: 40,
      date: "2026-08-16",
      country: "gbr",
      device: "MOBILE",
    });
    expect(valid).toMatchObject({
      url: "https://www.rovexo.co.uk/category/womens-fashion",
      pageType: "category",
      impressions: 2000,
      clicks: 40,
      ctr: 0.02,
    });

    expect(
      normalizeSearchPerformanceRecord({
        url: "https://www.rovexo.co.uk/category/womens-fashion",
        impressions: 100,
        clicks: 5,
        ctr: 0.9,
        date: "2026-08-16",
      }),
    ).toBeNull();
    expect(
      normalizeSearchPerformanceRecord({
        url: "https://www.rovexo.co.uk/listing/x",
        impressions: 10,
        clicks: 20,
        date: "2026-08-16",
      }),
    ).toBeNull();
    expect(normalizeSearchPerformanceRecord({ url: "/listing/x", impressions: 10, clicks: 1 })).toBeNull();
  });

  it("aggregates landing-page performance without fabricating extra impressions", () => {
    const first = normalizeSearchPerformanceRecord({
      url: "https://www.rovexo.co.uk/listing/nike-air-max",
      impressions: 100,
      clicks: 10,
      date: "2026-08-15",
    })!;
    const second = normalizeSearchPerformanceRecord({
      url: "https://www.rovexo.co.uk/listing/nike-air-max",
      impressions: 50,
      clicks: 5,
      date: "2026-08-16",
    })!;
    const [row] = aggregateLandingPagePerformance([first, second]);
    expect(row.impressions).toBe(150);
    expect(row.clicks).toBe(15);
    expect(row.ctr).toBe(0.1);
    expect(row.pageType).toBe("product");
  });

  it("attributes an organic landing using existing marketplace GA events", () => {
    expect(typeof trackViewListing).toBe("function");
    expect(typeof trackSaveListing).toBe("function");
    expect(typeof trackPurchase).toBe("function");
    expect(ORGANIC_FUNNEL_EVENT_MAP.listing_view).toEqual(
      expect.arrayContaining(["view_item", "view_listing"]),
    );

    expect(isOrganicAcquisition({ utmMedium: "cpc", utmSource: "google" })).toBe(false);
    expect(isOrganicAcquisition({ utmMedium: "organic", utmSource: "google" })).toBe(true);

    const attributed = attributeOrganicJourney({
      acquisition: { utmSource: "google", utmMedium: "organic" },
      landingPath: "/category/womens-fashion",
      events: [
        { name: "page_view", path: "/category/womens-fashion" },
        { name: "view_item", path: "/listing/nike-air-max" },
        { name: "save_listing" },
        { name: "make_offer" },
        { name: "sign_up" },
        { name: "purchase" },
      ],
    });
    expect(attributed.organic).toBe(true);
    expect(attributed.reusedExistingEvents).toBe(true);
    expect(attributed.steps).toEqual([
      "organic_visit",
      "landing_page",
      "listing_view",
      "favourite",
      "offer",
      "registration",
      "purchase",
    ]);

    const paid = attributeOrganicJourney({
      acquisition: { utmMedium: "cpc" },
      landingPath: "/listing/nike-air-max",
      events: [{ name: "view_item" }],
    });
    expect(paid.organic).toBe(false);
    expect(paid.steps).not.toContain("organic_visit");
  });

  it("detects deterministic SEO opportunities and priorities from explicit thresholds", () => {
    const thresholds = ORGANIC_SEO_THRESHOLDS_V1;
    const opportunities = detectSeoOpportunities({
      pages: [
        {
          url: "https://www.rovexo.co.uk/category/thin",
          impressions: 10,
          clicks: 1,
          eligibility: { eligible: false, reason: "inventory_gate_failed" } as never,
        },
        {
          url: "https://www.rovexo.co.uk/category/womens-fashion",
          impressions: thresholds.highImpressions,
          clicks: Math.floor(thresholds.highImpressions * (thresholds.lowCtr / 2)),
          averagePosition: 4,
        },
        {
          url: "https://www.rovexo.co.uk/listing/nike-air-max",
          impressions: thresholds.highImpressions,
          clicks: thresholds.highClicks,
          conversions: 0,
        },
        {
          url: "https://www.rovexo.co.uk/browse/fashion",
          impressions: thresholds.highImpressions,
          clicks: thresholds.highClicks,
          conversions: Math.ceil(thresholds.highClicks * thresholds.highConversionRate),
        },
      ],
    });

    expect(opportunities[0]).toMatchObject({ kind: "INDEXATION_ISSUE", priority: "P0" });
    expect(opportunities.some((row) => row.kind === "CTR_OPPORTUNITY" && row.reason === "good_position_low_ctr")).toBe(
      true,
    );
    expect(opportunities.some((row) => row.kind === "CONVERSION_OPPORTUNITY" && row.priority === "P2")).toBe(true);
    expect(opportunities.some((row) => row.kind === "SEO_WINNER" && row.priority === "P3")).toBe(true);
  });

  it("includes only eligible public listings in the merchant feed", () => {
    const eligible = buildMerchantFeedItem(listing());
    expect(eligible).toBeTruthy();
    expect(eligible?.link).toBe(canonicalForListing("nike-air-max").canonicalUrl);
    expect(eligible?.price).toBe("90.00 GBP");
    expect(eligible?.imageLink).toBe("https://cdn.example/nike.jpg");
    expect(eligible?.brand).toBe("Nike");
    expect(eligible).not.toHaveProperty("gtin");
    expect(eligible).not.toHaveProperty("mpn");
    expect(eligible).not.toHaveProperty("sku");
    expect(JSON.stringify(eligible)).not.toContain("seller@");
    expect(JSON.stringify(eligible)).not.toContain("accountNumber");

    expect(isForbiddenMarketplaceSlug("run4-cert-listing-demo")).toBe(true);
    expect(buildMerchantFeedItem(listing({ slug: "run4-cert-listing-demo" }))).toBeNull();
    expect(buildMerchantFeedItem(listing({ productFound: false, slug: "missing" }))).toBeNull();
    expect(evaluateListingSeoEligibility({ slug: "hidden", productFound: true, status: "draft" }).eligible).toBe(
      false,
    );
    expect(buildMerchantFeedItem(listing({ slug: "hidden", productStatus: "draft" }))).toBeNull();
    expect(buildMerchantFeedItem(listing({ slug: "gone", productStatus: "deleted" }))).toBeNull();
    expect(buildMerchantFeedItem(listing({ slug: "paused", productStatus: "paused" }))).toBeNull();

    const omitted = buildMerchantFeedItem(
      listing({
        imageUrl: "",
        images: [],
        brand: null,
        condition: null,
        description: null,
        gtin: null,
        mpn: null,
        sku: null,
      }),
    );
    expect(omitted?.imageLink).toBeUndefined();
    expect(omitted?.brand).toBeUndefined();
    expect(omitted?.gtin).toBeUndefined();
    expect(omitted?.mpn).toBeUndefined();
    expect(omitted?.sku).toBeUndefined();

    const feed = buildMerchantFeed([listing(), listing(), listing({ slug: "run4-cert-listing-demo" })]);
    expect(feed.items).toHaveLength(1);
    expect(feed.excluded).toBe(2);
    expect(new Set(feed.items.map((item) => item.link)).size).toBe(1);
  });

  it("keeps SEO experiments explicit and never applies production mutations", () => {
    expect(validateSeoExperiment(experiment()).valid).toBe(true);
    expect(validateSeoExperiment(experiment({ optIn: false })).valid).toBe(false);
    expect(validateSeoExperiment(experiment({ mutatesProduction: true })).valid).toBe(false);
    expect(canApplySeoExperiment(experiment({ status: "approved" }))).toBe(false);
    expect(canApplySeoExperiment(experiment({ status: "running", optIn: true }))).toBe(false);
  });
});
