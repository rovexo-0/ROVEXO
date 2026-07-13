import { describe, expect, it } from "vitest";
import { deriveAchievements } from "@/lib/seller-performance/achievements";
import {
  SELLER_PERFORMANCE_WEIGHTS,
  SELLER_LEVEL_LABELS,
  SELLER_LEVEL_THRESHOLDS,
} from "@/lib/seller-performance/master-spec";
import { levelForScore, progressToNextLevel } from "@/lib/seller-performance/levels";
import {
  buildComponentScores,
  calculateSellerPerformanceScore,
  clampSellerScore,
  scoreCompletedOrders,
  scoreReviews,
} from "@/lib/seller-performance/scoring";
import type { SellerPerformanceFactors } from "@/lib/seller-performance/types";
import * as fs from "node:fs";
import * as path from "node:path";

function baseFactors(overrides: Partial<SellerPerformanceFactors> = {}): SellerPerformanceFactors {
  return {
    reviews: {
      averageRating: 0,
      reviewCount: 0,
      stars: { five: 0, four: 0, three: 0, two: 0, one: 0 },
    },
    completedOrders: 0,
    messagesReceived: 0,
    messagesReplied: 0,
    responseRatePercent: 0,
    averageResponseTimeMinutes: null,
    averageDispatchTimeHours: null,
    dispatchWithin24hPercent: null,
    dispatchWithin48hPercent: null,
    cancelledOrders: 0,
    cancellationRatePercent: 0,
    validatedReports: 0,
    profileCompletion: { percent: 0, completed: [], missing: [] },
    storeActivity: {
      recentListings: 0,
      recentLogins: 0,
      recentMessages: 0,
      recentSales: 0,
      recentUpdates: 0,
      score: 0,
    },
    identityVerified: false,
    businessVerified: false,
    ...overrides,
  };
}

describe("seller performance MASTER_SPEC v1.0", () => {
  it("exposes canonical weights totalling 100%", () => {
    const total = Object.values(SELLER_PERFORMANCE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("defines seller levels per spec", () => {
    expect(SELLER_LEVEL_THRESHOLDS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: "new_seller", min: 0 }),
        expect.objectContaining({ level: "trusted_seller", min: 60 }),
        expect.objectContaining({ level: "top_seller", min: 75 }),
        expect.objectContaining({ level: "premium_seller", min: 90 }),
        expect.objectContaining({ level: "elite_seller", min: 98 }),
      ]),
    );
  });

  it("clamps seller score to 0–100", () => {
    expect(clampSellerScore(-3)).toBe(0);
    expect(clampSellerScore(42)).toBe(42);
    expect(clampSellerScore(120)).toBe(100);
  });

  it("maps scores to seller levels", () => {
    expect(levelForScore(0)).toBe("new_seller");
    expect(levelForScore(59)).toBe("new_seller");
    expect(levelForScore(60)).toBe("trusted_seller");
    expect(levelForScore(75)).toBe("top_seller");
    expect(levelForScore(90)).toBe("premium_seller");
    expect(levelForScore(98)).toBe("elite_seller");
    expect(levelForScore(100)).toBe("elite_seller");
  });

  it("calculates progress toward next level", () => {
    const progress = progressToNextLevel(65);
    expect(progress.currentLevel).toBe("trusted_seller");
    expect(progress.nextLevel).toBe("top_seller");
    expect(progress.pointsToNext).toBe(10);
    expect(progress.percent).toBeGreaterThan(0);
  });

  it("scores completed orders deterministically", () => {
    expect(scoreCompletedOrders(0)).toBe(0);
    expect(scoreCompletedOrders(1)).toBe(35);
    expect(scoreCompletedOrders(100)).toBe(95);
    expect(scoreCompletedOrders(1000)).toBe(100);
  });

  it("calculates weighted seller score from real factor snapshot", () => {
    const factors = baseFactors({
      reviews: {
        averageRating: 5,
        reviewCount: 20,
        stars: { five: 18, four: 2, three: 0, two: 0, one: 0 },
      },
      completedOrders: 50,
      responseRatePercent: 95,
      averageResponseTimeMinutes: 45,
      averageDispatchTimeHours: 20,
      cancellationRatePercent: 2,
      validatedReports: 0,
      profileCompletion: { percent: 100, completed: [], missing: [] },
      storeActivity: {
        recentListings: 3,
        recentLogins: 1,
        recentMessages: 10,
        recentSales: 6,
        recentUpdates: 2,
        score: 80,
      },
      identityVerified: true,
    });

    const components = buildComponentScores(factors);
    const score = calculateSellerPerformanceScore(factors);

    expect(scoreReviews(factors)).toBeGreaterThan(80);
    expect(components.completedOrders).toBe(85);
    expect(score).toBeGreaterThan(75);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("unlocks achievements from marketplace thresholds", () => {
    const factors = baseFactors({
      completedOrders: 100,
      identityVerified: true,
      responseRatePercent: 95,
      averageResponseTimeMinutes: 90,
      averageDispatchTimeHours: 12,
      reviews: {
        averageRating: 4.9,
        reviewCount: 12,
        stars: { five: 80, four: 25, three: 0, two: 0, one: 0 },
      },
      storeActivity: {
        recentListings: 2,
        recentLogins: 1,
        recentMessages: 4,
        recentSales: 6,
        recentUpdates: 1,
        score: 70,
      },
    });

    const achievements = deriveAchievements(92, factors);
    expect(achievements).toEqual(
      expect.arrayContaining([
        "first_sale",
        "orders_10",
        "orders_50",
        "verified_seller",
        "fast_responder",
        "fast_dispatch",
        "top_rated",
        "orders_100",
        "reviews_100_positive",
        "trending_seller",
        "trusted_seller",
        "top_seller",
        "premium_seller",
      ]),
    );
  });

  it("keeps scoring logic out of React components", () => {
    const componentDir = path.join(process.cwd(), "features/seller-performance/components");
    const files = fs.readdirSync(componentDir).filter((file) => file.endsWith(".tsx"));
    for (const file of files) {
      const source = fs.readFileSync(path.join(componentDir, file), "utf8");
      expect(source).not.toMatch(/calculateSellerPerformanceScore|buildComponentScores|collectSellerPerformanceFactors/);
    }
  });

  it("exposes human-readable seller level labels", () => {
    expect(SELLER_LEVEL_LABELS.elite_seller).toBe("Elite Seller");
    expect(SELLER_LEVEL_LABELS.new_seller).toBe("New Seller");
  });
});
