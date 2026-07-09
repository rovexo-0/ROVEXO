import { describe, expect, it } from "vitest";
import {
  SEO_ENGINE_VERSION,
  getStaticDiscoverySlugs,
  isDiscoverySlug,
  resolveDiscoveryPage,
  resolveLocationCategoryPage,
  resolveLocationFirstRewrite,
  shouldRewriteToDiscover,
} from "@/lib/seo/engine";
import { runSeoAudit, sitemapIndexUrls } from "@/lib/seo/audit";
import { buildDiscoverSitemapEntries, buildBrowseComboSitemapEntries } from "@/lib/seo/sitemaps/generators";

describe("ROVEXO Organic Traffic & SEO Engine v1.0", () => {
  it("exposes engine version", () => {
    expect(SEO_ENGINE_VERSION).toBe("4.0.0");
  });

  it("resolves inventory-driven discovery landing pages", () => {
    const usedIphone = resolveDiscoveryPage("used-iphone");
    expect(usedIphone?.title).toContain("Used iPhone");
    expect(usedIphone?.search.brand).toBe("Apple");
    expect(usedIphone?.search.conditions).toEqual(["Used"]);

    const buyElectronics = resolveDiscoveryPage("buy-electronics");
    expect(buyElectronics?.title).toContain("Buy Electronics");

    const cheapLaptop = resolveDiscoveryPage("cheap-laptop");
    expect(cheapLaptop?.search.sort).toBe("price_asc");

    const local = resolveDiscoveryPage("gaming-laptop-manchester");
    expect(local?.search.locationCity).toBe("Manchester");
  });

  it("rewrites root discovery slugs and location-first URLs", () => {
    expect(isDiscoverySlug("used-iphone")).toBe(true);
    expect(isDiscoverySlug("login")).toBe(false);
    expect(shouldRewriteToDiscover("/used-iphone")).toBe("/discover/used-iphone");
    expect(resolveLocationFirstRewrite("/london/electronics")).toBe("/l/london/electronics");
  });

  it("resolves location + category pages", () => {
    const page = resolveLocationCategoryPage("manchester", ["furniture"]);
    expect(page?.title).toBe("Furniture in Manchester");
    expect(page?.path).toBe("/l/manchester/furniture");
  });

  it("generates expanded sitemap segments", () => {
    expect(buildDiscoverSitemapEntries().length).toBeGreaterThan(50);
    expect(buildBrowseComboSitemapEntries().length).toBeGreaterThan(100);
    expect(sitemapIndexUrls().length).toBe(12);
    expect(sitemapIndexUrls().some((url) => url.endsWith("/sitemap/brands.xml"))).toBe(true);
  });

  it("reports discovery pages in SEO audit", () => {
    const report = runSeoAudit();
    expect(report.engineVersion).toBe("4.0.0");
    expect(report.stats.sitemapSegments).toBe(12);
    expect(report.stats.discoveryPages).toBe(getStaticDiscoverySlugs().length);
    expect(report.score).toBeGreaterThanOrEqual(80);
  });
});
