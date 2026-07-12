import { describe, expect, it } from "vitest";
import { runSeoAudit, sitemapIndexUrls } from "@/lib/seo/audit";
import { resolveProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { findLocationBySlug, UK_NATIONS } from "@/lib/seo/locations/uk";
import { buildCategorySitemapEntries, buildStaticSitemapEntries } from "@/lib/seo/sitemaps/generators";
import { MARKET_REGIONS, getActiveMarket } from "@/lib/seo/markets";

describe("enterprise SEO engine", () => {
  it("resolves programmatic browse pages", () => {
    const carsLondon = resolveProgrammaticPage(["cars", "london"]);
    expect(carsLondon?.type).toBe("category-location");
    expect(carsLondon?.locationName).toBe("London");

    const phonesApple = resolveProgrammaticPage(["phones", "apple"]);
    expect(phonesApple?.type).toBe("category-brand");
    expect(phonesApple?.brand).toBe("Apple");

    const bedding = resolveProgrammaticPage(["bedding"]);
    expect(bedding?.categorySlugs).toContain("bedding");
  });

  it("covers UK nations and counties for local SEO", () => {
    expect(UK_NATIONS.length).toBe(4);
    expect(findLocationBySlug("manchester")?.name).toBe("Manchester");
    expect(findLocationBySlug("scotland")?.type).toBe("nation");
  });

  it("generates category and static sitemap entries", () => {
    expect(buildStaticSitemapEntries().length).toBeGreaterThan(5);
    expect(buildCategorySitemapEntries().length).toBeGreaterThan(1000);
  });

  it("reports sitemap segments and audit score", () => {
    const report = runSeoAudit();
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.stats.sitemapSegments).toBe(12);
    expect(sitemapIndexUrls().length).toBe(12);
    expect(report.engineVersion).toBe("4.0.0");
    expect(report.stats.categoryPages).toBe(buildCategorySitemapEntries().length);
    expect(report.stats.locationPages).toBeGreaterThanOrEqual(100);
  });

  it("prepares future market regions without redesign", () => {
    expect(getActiveMarket().code).toBe("uk");
    expect(MARKET_REGIONS.length).toBeGreaterThanOrEqual(9);
  });
});
