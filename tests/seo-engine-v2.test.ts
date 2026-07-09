import { describe, expect, it } from "vitest";
import {
  MIN_INVENTORY_TO_INDEX,
  SEO_ENGINE_VERSION,
  classifySearchIntent,
  evaluateZeroResults,
  generatePageFaq,
  resolveCollectionPage,
  resolveDiscoveryPage,
  runSeoRegressionSuite,
} from "@/lib/seo/engine";
import { resolveProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { getAllCollectionSlugs } from "@/lib/seo/engine/collections";
import { sitemapIndexUrls } from "@/lib/seo/audit";

describe("ROVEXO SEO Engine v2.0", () => {
  it("uses v2 engine version and inventory threshold", () => {
    expect(SEO_ENGINE_VERSION).toBe("4.0.0");
    expect(MIN_INVENTORY_TO_INDEX).toBe(3);
  });

  it("resolves brand + location + category programmatic pages", () => {
    const page = resolveProgrammaticPage(["shoes", "nike", "manchester"]);
    expect(page?.type).toBe("category-brand-location");
    expect(page?.brand).toBe("Nike");
    expect(page?.locationName).toBe("Manchester");
  });

  it("resolves discovery brand-location slugs", () => {
    const page = resolveDiscoveryPage("nike-shoes-manchester");
    expect(page?.search.brand).toBe("Nike");
    expect(page?.search.locationCity).toBe("Manchester");
  });

  it("classifies search intent from page facets", () => {
    const page = resolveCollectionPage("under-50");
    expect(page).not.toBeNull();
    const intent = classifySearchIntent(page!);
    expect(intent).toBe("transactional");
  });

  it("generates template FAQ without AI", () => {
    const page = resolveDiscoveryPage("used-iphone");
    expect(page).not.toBeNull();
    const faq = generatePageFaq(page!, 10);
    expect(faq.length).toBeGreaterThan(1);
    expect(faq[0]?.question).toContain("ROVEXO");
  });

  it("noindexes pages below inventory threshold", () => {
    const page = resolveCollectionPage("best-deals");
    const decision = evaluateZeroResults(page!, 2);
    expect(decision.indexable).toBe(false);
    expect(decision.action).toBe("noindex");
  });

  it("indexes pages meeting inventory threshold", () => {
    const page = resolveCollectionPage("best-deals");
    const decision = evaluateZeroResults(page!, MIN_INVENTORY_TO_INDEX);
    expect(decision.indexable).toBe(true);
  });

  it("resolves all collection slugs", () => {
    for (const slug of getAllCollectionSlugs()) {
      expect(resolveCollectionPage(slug)).not.toBeNull();
    }
  });

  it("passes automated SEO regression suite", () => {
    const report = runSeoRegressionSuite();
    expect(report.passed).toBe(true);
    expect(report.criticalCount).toBe(0);
  });

  it("reports 12 sitemap segments", () => {
    expect(sitemapIndexUrls().length).toBe(12);
  });
});
