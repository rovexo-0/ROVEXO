import { describe, expect, it } from "vitest";
import {
  SEO_ENGINE_VERSION,
  PLATFORM_NAME,
  MIN_INVENTORY_TO_INDEX,
  MIN_QUALITY_SCORE_TO_INDEX,
  MIN_DEMAND_FOR_LONG_TAIL,
  PERFORMANCE_TARGETS,
  buildOrganicGrowthContext,
  computeSearchDemand,
  computeSeoQualityScore,
  evaluateFacetIndexing,
  evaluateLongTailExpansion,
  resolveLongTailPage,
  resolveCollectionPage,
  runSeoRegressionSuite,
  buildPageLinkGraph,
  validateJsonLdGraph,
  demandFromProducts,
  optimizeInternalLinks,
  validateSitemapConfiguration,
  splitSitemapUrls,
  runOrganicGrowthOptimization,
  detectEmergingEntities,
  detectHighFrequencySearches,
  buildWebSiteSearchAction,
  hasCriticalStructuredDataErrors,
} from "@/lib/seo/engine";

describe("ROVEXO Organic Growth Platform v4.0", () => {
  it("exposes v4 platform identity", () => {
    expect(SEO_ENGINE_VERSION).toBe("4.0.0");
    expect(PLATFORM_NAME).toContain("Organic Growth");
    expect(MIN_INVENTORY_TO_INDEX).toBe(3);
    expect(MIN_QUALITY_SCORE_TO_INDEX).toBe(55);
    expect(MIN_DEMAND_FOR_LONG_TAIL).toBe(20);
    expect(PERFORMANCE_TARGETS.seo).toBe(95);
  });

  it("computes internal search demand from marketplace signals", () => {
    const demand = computeSearchDemand({
      views: 1000,
      likes: 50,
      orders: 10,
      conversionRate: 0.05,
      inventory: 20,
      freshnessDays: 2,
      isPremium: true,
    });
    expect(demand.normalized).toBeGreaterThan(20);
    expect(demand.reasons).toContain("views");
  });

  it("evaluates long-tail expansion with inventory gates", () => {
    const page = resolveLongTailPage("phones-apple")!;
    const demand = computeSearchDemand(demandFromProducts([], 2));
    const decision = evaluateLongTailExpansion({
      page,
      listingCount: 2,
      qualityScore: 70,
      demand,
      duplicateRisk: 0,
    });
    expect(decision.eligible).toBe(true);
    expect(decision.indexable).toBe(false);
    expect(decision.action).toBe("noindex");
  });

  it("optimizes internal link priority order", () => {
    const groups = optimizeInternalLinks(
      [
        {
          title: "Browse",
          links: [
            { label: "Trending", href: "/trends/hot" },
            { label: "Home", href: "/" },
          ],
        },
      ],
      [{ href: "/trends/hot", score: 110 }],
    );
    expect(groups[0]!.links[0]!.href).toBe("/trends/hot");
  });

  it("validates sitemap engine configuration", () => {
    const result = validateSitemapConfiguration();
    expect(result.segmentCount).toBeGreaterThanOrEqual(12);
    expect(result.valid).toBe(true);
  });

  it("splits sitemap URLs at enterprise chunk size", () => {
    const urls = Array.from({ length: 100_001 }, (_, index) => `/listing/item-${index}`);
    const chunks = splitSitemapUrls(urls, 50_000);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(50_000);
  });

  it("validates WebSite and SearchAction structured data", () => {
    const schema = buildWebSiteSearchAction("https://rovexo.com");
    expect(hasCriticalStructuredDataErrors([schema])).toBe(false);
  });

  it("runs organic growth optimizer", async () => {
    const result = await runOrganicGrowthOptimization();
    expect(result.evaluatedAt).toBeTruthy();
    expect(Array.isArray(result.indexableDiscoverySlugs)).toBe(true);
    expect(Array.isArray(result.emergingBrands)).toBe(true);
  });

  it("detects emerging entities and high-frequency searches", async () => {
    const [emerging, searches] = await Promise.all([
      detectEmergingEntities(),
      detectHighFrequencySearches(5),
    ]);
    expect(Array.isArray(emerging.brands)).toBe(true);
    expect(searches.length).toBeGreaterThan(0);
  });

  it("builds full organic growth context with optimized links", () => {
    const page = resolveCollectionPage("newly-listed")!;
    const ctx = buildOrganicGrowthContext(page, [], 0);
    expect(ctx.indexable).toBe(false);
    expect(ctx.structuredDataValid).toBe(true);
    expect(ctx.internalLinks.length).toBeGreaterThan(0);
  });

  it("passes v4 deployment regression gate", () => {
    const report = runSeoRegressionSuite();
    expect(report.passed).toBe(true);
    expect(report.criticalCount).toBe(0);
  });
});
