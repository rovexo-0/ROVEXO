import { describe, expect, it } from "vitest";
import {
  SEO_ENGINE_VERSION,
  PLATFORM_NAME,
  MIN_INVENTORY_TO_INDEX,
  MIN_QUALITY_SCORE_TO_INDEX,
  buildOrganicGrowthContext,
  computeSearchDemand,
  computeSeoQualityScore,
  evaluateFacetIndexing,
  resolveLongTailPage,
  resolveCollectionPage,
  runSeoRegressionSuite,
  buildPageLinkGraph,
  validateJsonLdGraph,
  demandFromProducts,
} from "@/lib/seo/engine";

describe("ROVEXO Organic Growth Platform v3.0", () => {
  it("exposes v3 platform identity", () => {
    expect(SEO_ENGINE_VERSION).toBe("4.0.0");
    expect(PLATFORM_NAME).toContain("Organic Growth");
    expect(MIN_INVENTORY_TO_INDEX).toBe(3);
    expect(MIN_QUALITY_SCORE_TO_INDEX).toBe(55);
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

  it("evaluates facet indexing decisions", () => {
    const page = resolveCollectionPage("under-50")!;
    const demand = computeSearchDemand(demandFromProducts([], 0));
    const facet = evaluateFacetIndexing({
      page,
      listingCount: 0,
      demand,
      qualityScore: 30,
      duplicateRisk: 0,
      internalLinkCount: 0,
    });
    expect(facet.decision).toBe("noindex");
  });

  it("resolves long-tail brand + category pages", () => {
    const page = resolveLongTailPage("phones-apple");
    expect(page?.search.brand).toBe("Apple");
    expect(page?.facetTypes).toContain("brand");
  });

  it("assigns quality scores and blocks thin pages", () => {
    const page = resolveCollectionPage("best-deals")!;
    const demand = computeSearchDemand(demandFromProducts([], 2));
    const facet = evaluateFacetIndexing({
      page,
      listingCount: 2,
      demand,
      qualityScore: 40,
      duplicateRisk: 0,
      internalLinkCount: 3,
    });
    const quality = computeSeoQualityScore({
      page,
      listingCount: 2,
      products: [],
      demand,
      facetEvaluation: facet,
      internalLinkCount: 3,
      hasStructuredData: true,
      duplicateRisk: 0,
    });
    expect(quality.indexable).toBe(false);
  });

  it("builds full organic growth context with link graph", () => {
    const page = resolveCollectionPage("newly-listed")!;
    const ctx = buildOrganicGrowthContext(page, [], 0);
    expect(ctx.indexable).toBe(false);
    expect(ctx.structuredDataValid).toBe(true);
    expect(ctx.internalLinks.length).toBeGreaterThan(0);
  });

  it("prevents orphan pages via link graph", () => {
    const page = resolveCollectionPage("trending-today")!;
    const graph = buildPageLinkGraph({ page, products: [], total: 0 });
    expect(graph.orphan).toBe(false);
    expect(graph.linkCount).toBeGreaterThan(0);
  });

  it("validates structured data graphs", () => {
    const issues = validateJsonLdGraph([
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "Test" },
    ]);
    expect(issues.filter((issue) => issue.severity === "critical")).toHaveLength(0);
  });

  it("passes v3 deployment regression gate", () => {
    const report = runSeoRegressionSuite();
    expect(report.passed).toBe(true);
    expect(report.criticalCount).toBe(0);
  });
});
