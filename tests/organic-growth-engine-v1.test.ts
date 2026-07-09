import { describe, expect, it } from "vitest";
import {
  ORGANIC_GROWTH_ENGINE_VERSION,
  ORGANIC_GROWTH_PLATFORM_NAME,
  MIN_COLLECTION_INVENTORY,
  computePopularityScore,
  popularityFromProduct,
  buildZeroResultRecovery,
  buildBuyerRetentionPlan,
  buildDiscoveryFeed,
  detectGrowingTrends,
  detectGrowthOpportunities,
  evaluateCollectionOpportunity,
  isCollectionPublishable,
  buildEngagementFeed,
  runOrganicGrowthAutomation,
  buildPageSocialDiscovery,
} from "@/lib/organic-growth";
import type { Product } from "@/lib/products/types";

const sampleProduct: Product = {
  id: "1",
  slug: "test-item",
  title: "Apple iPhone 15",
  price: 500,
  condition: "Used",
  brand: "Apple",
  sellerName: "Seller",
  sellerId: "s1",
  sellerUsername: "seller1",
  sellerVerified: true,
  views: 100,
  likes: 20,
  isFeatured: true,
  imageUrl: "/placeholder-product.svg",
  createdAt: new Date().toISOString(),
} as Product;

describe("ROVEXO Organic Growth Engine v1.0", () => {
  it("exposes v1 engine identity", () => {
    expect(ORGANIC_GROWTH_ENGINE_VERSION).toBe("1.0.0");
    expect(ORGANIC_GROWTH_PLATFORM_NAME).toContain("Organic Growth");
    expect(MIN_COLLECTION_INVENTORY).toBe(3);
  });

  it("computes popularity from marketplace signals", () => {
    const signals = popularityFromProduct(sampleProduct);
    const score = computePopularityScore(signals);
    expect(score.normalized).toBeGreaterThan(20);
    expect(score.reasons).toContain("views");
  });

  it("builds zero-result recovery without dead ends", () => {
    const recovery = buildZeroResultRecovery("apple iphone", 0);
    expect(recovery.recoveryLinks.length).toBeGreaterThan(0);
    expect(recovery.recoveryLinks.some((link) => link.href.startsWith("/"))).toBe(true);
  });

  it("evaluates collection publishability thresholds", () => {
    expect(isCollectionPublishable(2, 70)).toBe(false);
    expect(isCollectionPublishable(5, 60)).toBe(true);
    expect(evaluateCollectionOpportunity("best-deals", 5, 60)?.type).toBe("new_collection");
  });

  it("builds buyer retention surfaces", () => {
    const plan = buildBuyerRetentionPlan({ hasFavorites: true });
    expect(plan.surfaces.length).toBeGreaterThan(5);
    expect(plan.notifications.length).toBeGreaterThan(0);
  });

  it("builds discovery feed with active items", async () => {
    const feed = await buildDiscoveryFeed();
    expect(feed.items.length).toBeGreaterThan(10);
    expect(feed.items.every((item) => item.active)).toBe(true);
  });

  it("detects growing trends", async () => {
    const trends = await detectGrowingTrends(5);
    expect(Array.isArray(trends)).toBe(true);
  });

  it("detects growth opportunities", async () => {
    const opportunities = await detectGrowthOpportunities(5);
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it("builds engagement feed", async () => {
    const feed = await buildEngagementFeed({ recentSearches: ["iphone"] });
    expect(feed.recommendations.length).toBeGreaterThan(0);
  });

  it("builds social discovery previews", () => {
    const social = buildPageSocialDiscovery({
      title: "Trending Today | ROVEXO",
      description: "Hot listings",
      path: "/collections/trending-today",
    });
    expect(social.previews.length).toBeGreaterThan(5);
    expect(social.openGraph.image).toContain("/api/seo/og");
  });

  it("runs automation cycle", async () => {
    const result = await runOrganicGrowthAutomation();
    expect(result.status).toBe("completed");
    expect(result.executedAt).toBeTruthy();
  });
});
