import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Google Analytics 4 integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("loads measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123456");
    const { GA_MEASUREMENT_ID } = await import("@/lib/analytics/ga4-config");
    expect(GA_MEASUREMENT_ID).toBe("G-TEST123456");
  });

  it("enables GA only in production unless debug flag is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123456");
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_GA_DEBUG;
    vi.resetModules();
    const devConfig = await import("@/lib/analytics/ga4-config");
    expect(devConfig.isGoogleAnalyticsEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG", "true");
    vi.resetModules();
    const debugConfig = await import("@/lib/analytics/ga4-config");
    expect(debugConfig.isGoogleAnalyticsEnabled()).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_GA_DEBUG;
    vi.resetModules();
    const prodConfig = await import("@/lib/analytics/ga4-config");
    expect(prodConfig.isGoogleAnalyticsEnabled()).toBe(true);
  });

  it("uses official @next/third-parties GoogleAnalytics component", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/analytics/GoogleAnalytics.tsx"),
      "utf8",
    );
    expect(source).toContain("@next/third-parties/google");
    expect(source).toContain("GoogleAnalyticsPageView");
  });

  it("exports marketplace analytics helpers for required events", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/analytics/marketplace-events.ts"),
      "utf8",
    );

    const requiredEvents = [
      "trackMarketplaceSearch",
      "trackViewListing",
      "trackSaveListing",
      "trackShareListing",
      "trackContactSeller",
      "trackStartCheckout",
      "trackPurchase",
      "trackCreateListing",
      "trackEditListing",
      "trackDeleteListing",
      "trackMarketplaceLogin",
      "trackMarketplaceRegister",
      "trackAuctionView",
      "trackAuctionBid",
      "trackWatchlistAdd",
      "trackTrustProfileView",
    ];

    for (const helper of requiredEvents) {
      expect(source).toContain(`export function ${helper}`);
    }
  });

  it("tracks client navigations via page_view helper", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/analytics/GoogleAnalyticsPageView.tsx"),
      "utf8",
    );
    expect(source).toContain("trackGaPageView");
    expect(source).toContain("usePathname");
  });
});
