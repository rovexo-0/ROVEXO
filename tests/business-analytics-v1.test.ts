import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_ANALYTICS_CAPABILITIES,
  BUSINESS_ANALYTICS_PERIODS,
  computeAverageSale,
  computeConversionRate,
  computePeriodDelta,
  formatBusinessGbp,
  isEligibleBusinessSale,
  listingHrefFromSlug,
  resolveBusinessAnalyticsWindow,
} from "@/lib/analytics/business-analytics-v1";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Business Analytics v1 formulas", () => {
  it("computes average sale only when orders exist", () => {
    expect(computeAverageSale(126.81, 6)).toBeCloseTo(21.135);
    expect(computeAverageSale(100, 0)).toBeNull();
  });

  it("computes conversion only from real views", () => {
    expect(computeConversionRate(6, 192)).toBe(3.1);
    expect(computeConversionRate(6, 0)).toBeNull();
  });

  it("does not invent a prior-period percentage when prior is zero", () => {
    expect(computePeriodDelta(6, 0)).toBeNull();
    expect(computePeriodDelta(6, 2)).toBe(200);
  });

  it("excludes cancelled and refunded business orders", () => {
    expect(
      isEligibleBusinessSale({ status: "paid", seller_context: "business" }),
    ).toBe(true);
    expect(
      isEligibleBusinessSale({ status: "cancelled", seller_context: "business" }),
    ).toBe(false);
    expect(
      isEligibleBusinessSale({ status: "paid", seller_context: "individual" }),
    ).toBe(false);
    expect(
      isEligibleBusinessSale({
        status: "paid",
        seller_context: "business",
        refunded_at: "2026-09-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("keeps 30-day windows on the same London day keys for cards and charts", () => {
    const now = new Date("2026-09-02T15:00:00.000Z");
    const window = resolveBusinessAnalyticsWindow({ period: "30d", now });
    expect(window.label).toBe("30 Days");
    expect(window.dayKeys).toHaveLength(30);
    expect(window.dayKeys[window.dayKeys.length - 1]).toBe("2026-09-02");
    expect(BUSINESS_ANALYTICS_PERIODS.map((period) => period.id)).toEqual([
      "today",
      "7d",
      "30d",
      "90d",
      "custom",
    ]);
  });

  it("formats GBP and listing destinations without fabricated values", () => {
    expect(formatBusinessGbp(126.81)).toBe("£126.81");
    expect(listingHrefFromSlug("neck-pillow", "p1")).toBe("/listing/neck-pillow");
    expect(listingHrefFromSlug(null, "p1")).toBe("/seller/listings/p1/edit");
    expect(BUSINESS_ANALYTICS_CAPABILITIES.clickThroughRate).toBe(false);
    expect(BUSINESS_ANALYTICS_CAPABILITIES.trafficSources).toBe(false);
    expect(BUSINESS_ANALYTICS_CAPABILITIES.searchKeywords).toBe(false);
  });
});

describe("Business Analytics v1 isolation and UI contracts", () => {
  it("loads only Business seller-owned orders and real listing views", () => {
    const store = src("lib/analytics/store.ts");
    expect(store).toContain('.eq("seller_context", "business")');
    expect(store).toContain("isEligibleBusinessSale");
    expect(store).toContain("product_view_events");
    expect(store).toContain("active_seller_context");
    expect(store).toContain("getBusinessAnalyticsData");
    expect(store).not.toContain("geographicSales");
  });

  it("gates the Business Analytics API and route on Stripe + business context", () => {
    const api = src("app/api/analytics/route.ts");
    const page = src("app/(platform)/business/analytics/page.tsx");
    expect(api).toContain("type === \"business\"");
    expect(api).toContain("!status.stripe.verified");
    expect(api).toContain('!== "business"');
    expect(page).toContain("status.activeSellerContext !== \"business\"");
    expect(page).toContain("status.stripe.verified");
    expect(page).toContain('backHref="/business/menu"');
  });

  it("renders the reference Sales and Traffic structure without fabricated sections", () => {
    const page = src("features/analytics/components/BusinessAnalyticsPage.tsx");
    expect(page).toContain("data-business-analytics=\"v1\"");
    expect(page).toContain("Sales");
    expect(page).toContain("Traffic");
    expect(page).toContain("BUSINESS_ANALYTICS_PERIODS");
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain('label: "Today"');
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain('label: "7 Days"');
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain('label: "30 Days"');
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain('label: "90 Days"');
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain('label: "Custom"');
    expect(page).toContain("Business overview");
    expect(page).toContain("Top Products");
    expect(page).toContain("Recent Sales");
    expect(page).toContain("Where buyers found you");
    expect(page).toContain("Top searched keywords");
    expect(page).toContain("PLATFORM_EMOJI");
    expect(page).toContain("/business/inventory");
    expect(page).toContain("/business/orders");
    expect(page).not.toContain("DNS Europa");
    expect(page).not.toContain("AnalyticsDoughnutChart");
    expect(page).not.toContain("AnalyticsGeographicSection");
    expect(page).not.toContain("AnalyticsExportSection");
    expect(page).not.toContain("Promo CTR");
    expect(page).not.toContain("Sales Channels");
    expect(page).not.toContain("from \"lucide-react\"");
    expect(page).not.toContain("2.8%");
    expect(page).not.toContain("3.1%");
    expect(page).not.toContain("HELP_HREF");
    expect(page).not.toContain('href="/help"');
    expect(page).not.toContain('aria-label="Help"');
    expect(page).not.toContain("PLATFORM_EMOJI.help");
  });

  it("uses one analytics request per period change", () => {
    const hook = src("features/analytics/hooks/use-business-analytics-v1.ts");
    expect(hook).toContain("fetch(`/api/analytics?");
    expect(hook).toContain("type: \"business\"");
    expect(hook.match(/fetch\(/g)?.length).toBe(1);
  });
});
