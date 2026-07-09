import { describe, expect, it } from "vitest";
import {
  MARKETPLACE_INTELLIGENCE_VERSION,
  MARKETPLACE_INTELLIGENCE_NAME,
  DEFAULT_THRESHOLDS,
  clampScore,
  evaluateListingQuality,
  evaluateMarketplaceHealth,
  evaluateCategoryHealth,
  evaluateSearchQuality,
  buildMarketplaceZeroResultRecovery,
  computeProductRankingScore,
  detectMarketplaceOpportunities,
  detectMarketplaceTrends,
  createDefaultMarketplaceIntelligenceDocument,
  runMarketplaceIntelligenceAutomation,
} from "@/lib/marketplace-intelligence";
import type { Product } from "@/lib/products/types";

const sampleProduct = {
  id: "p1",
  slug: "test-phone",
  title: "Apple iPhone 15 Pro Max 256GB",
  description: "Excellent condition iPhone with original box and charger included.",
  price: 799,
  views: 120,
  likes: 15,
  stock: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  categoryId: "cat-1",
  sellerVerified: true,
  imageUrl: "/placeholder-product.svg",
  condition: "Used",
  sellerName: "Seller",
  sellerId: "s1",
} as unknown as Product;

describe("ROVEXO Marketplace Intelligence Platform v1.0", () => {
  it("exposes v1 platform identity", () => {
    expect(MARKETPLACE_INTELLIGENCE_VERSION).toBe("1.0.0");
    expect(MARKETPLACE_INTELLIGENCE_NAME).toContain("Marketplace Intelligence");
    expect(DEFAULT_THRESHOLDS.minQualityScore).toBe(55);
  });

  it("creates configurable default document", () => {
    const doc = createDefaultMarketplaceIntelligenceDocument();
    expect(doc.thresholds.minInventory).toBe(3);
    expect(doc.rankingWeights.freshness).toBe(30);
    expect(doc.modules.length).toBeGreaterThan(10);
  });

  it("evaluates listing quality deterministically", () => {
    const report = evaluateListingQuality(
      {
        slug: "test-phone",
        title: "Apple iPhone 15",
        description: "A long enough description for quality scoring on ROVEXO marketplace listings.",
        price: 500,
        categoryId: "cat-1",
        imageCount: 4,
        status: "published",
        views: 50,
      },
      DEFAULT_THRESHOLDS,
    );
    expect(report.score).toBeGreaterThan(40);
    expect(report.factors.imageCount).toBeGreaterThan(0);
  });

  it("computes product ranking without randomness", () => {
    const ranking = computeProductRankingScore(sampleProduct, DEFAULT_THRESHOLDS);
    expect(ranking.score).toBeGreaterThan(0);
    expect(ranking.factors.freshness).toBeGreaterThan(0);
  });

  it("builds zero-result recovery with alternatives", () => {
    const recovery = buildMarketplaceZeroResultRecovery("apple iphone", 0, DEFAULT_THRESHOLDS);
    expect(recovery.recoveryLinks.length).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.zeroResultRecoveryMinLinks);
    expect(recovery.alternativePriceRanges.length).toBeGreaterThan(0);
  });

  it("evaluates category health", async () => {
    const categories = await evaluateCategoryHealth(DEFAULT_THRESHOLDS);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]?.score).toBeGreaterThanOrEqual(0);
  });

  it("evaluates marketplace health composite", async () => {
    const health = await evaluateMarketplaceHealth(DEFAULT_THRESHOLDS);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(["healthy", "warning", "critical"]).toContain(health.status);
  });

  it("evaluates search quality metrics", async () => {
    const search = await evaluateSearchQuality(DEFAULT_THRESHOLDS);
    expect(search.healthScore).toBeGreaterThanOrEqual(0);
    expect(search.zeroResultRate).toBeGreaterThanOrEqual(0);
  });

  it("detects marketplace opportunities", async () => {
    const opportunities = await detectMarketplaceOpportunities(DEFAULT_THRESHOLDS);
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it("detects marketplace trends", async () => {
    const trends = await detectMarketplaceTrends(5);
    expect(trends.length).toBeGreaterThan(0);
  });

  it("runs automation cycle", async () => {
    const result = await runMarketplaceIntelligenceAutomation(DEFAULT_THRESHOLDS);
    expect(result.status).toBe("completed");
    expect(result.executedAt).toBeTruthy();
  });

  it("clamps scores to 0-100", () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
  });
});
