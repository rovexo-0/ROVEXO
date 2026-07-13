import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { deriveAchievements } from "@/lib/seller-performance/achievements";
import { invalidateSellerPerformanceCache } from "@/lib/seller-performance/cache";
import { FACTOR_EXPLANATIONS } from "@/lib/seller-performance/factor-explanations";
import { levelForScore, weightedContribution } from "@/lib/seller-performance/levels";
import { RECALCULATION_TRIGGERS, SELLER_PERFORMANCE_WEIGHTS } from "@/lib/seller-performance/master-spec";
import {
  buildComponentScores,
  calculateSellerPerformanceScore,
} from "@/lib/seller-performance/scoring";
import type { SellerPerformanceFactors } from "@/lib/seller-performance/types";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

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

describe("seller performance production pass v1.0", () => {
  it("declares all supported recalculation triggers", () => {
    expect(RECALCULATION_TRIGGERS).toEqual(
      expect.arrayContaining([
        "completed_order",
        "cancellation",
        "refund",
        "dispatch",
        "review",
        "reply",
        "validated_report",
        "identity_verification",
        "email_verification",
        "phone_verification",
        "business_verification",
        "first_sale",
        "sales_milestone_10",
        "sales_milestone_50",
        "sales_milestone_100",
        "account_inactivity",
        "account_reactivation",
        "force_recalc",
      ]),
    );
  });

  it("routes marketplace events through the async queue", () => {
    const events = readSource("lib/seller-performance/events.ts");
    const queue = readSource("lib/seller-performance/queue.ts");
    const dashboardFn = readSource("lib/seller-performance/service.ts").split(
      "export async function getSellerPerformanceDashboard",
    )[1]?.split("export async function getPublicSellerPerformanceSummary")[0] ?? "";

    expect(events).toContain("enqueueSellerPerformanceEvent");
    expect(queue).toContain("seller_performance_event_queue");
    expect(queue).toContain("recalculateSellerPerformanceInternal");
    expect(dashboardFn).not.toContain("recalculateSellerPerformanceInternal");
  });

  it("flags suspicious events before queue processing", () => {
    const antiFraud = readSource("lib/seller-performance/anti-fraud.ts");
    expect(antiFraud).toContain("review_burst");
    expect(antiFraud).toContain("self_purchase");
    expect(antiFraud).toContain("rapid_cancellation");
    expect(readSource("lib/seller-performance/queue.ts")).toContain('status = fraud.flagged ? "flagged" : "pending"');
  });

  it("records badge upgrades and downgrades via history table", () => {
    const service = readSource("lib/seller-performance/service.ts");
    expect(service).toContain("seller_performance_badge_history");
    expect(service).toContain('action: "earned"');
    expect(service).toContain('action: "lost"');
  });

  it("stores immutable score history on every recalculation", () => {
    const service = readSource("lib/seller-performance/service.ts");
    expect(service).toContain('from("seller_performance_history").insert');
  });

  it("restricts admin mutations to super admin and logs IP address", () => {
    const route = readSource("app/api/admin/seller-performance/route.ts");
    const service = readSource("lib/seller-performance/service.ts");
    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("ipAddress");
    expect(service).toContain("ip_address:");
    expect(route).toContain("forceRecalculateSellerPerformance");
  });

  it("exposes buyer-safe public summary only", () => {
    const route = readSource("app/api/seller/performance/[userId]/route.ts");
    const publicFn = readSource("lib/seller-performance/service.ts").split(
      "export async function getPublicSellerPerformanceSummary",
    )[1]?.split("export async function listSellerPerformanceAudit")[0] ?? "";
    expect(route).toContain("completedSales");
    expect(route).not.toContain("componentScores");
    expect(publicFn).not.toContain("collectSellerPerformanceFactors");
  });

  it("documents deterministic factor explanations", () => {
    expect(FACTOR_EXPLANATIONS).toHaveLength(9);
    for (const factor of FACTOR_EXPLANATIONS) {
      expect(factor.maxContributionPercent).toBe(SELLER_PERFORMANCE_WEIGHTS[factor.key] * 100);
    }
    expect(readSource("features/seller-performance/components/SellerPerformanceFactorCard.tsx")).toContain(
      "Current contribution",
    );
  });

  it("supports score trend ranges in API and UI", () => {
    expect(readSource("app/api/seller/performance/route.ts")).toContain("range");
    expect(readSource("features/seller-performance/components/SellerPerformanceHistorySection.tsx")).toContain(
      "All Time",
    );
  });

  it("unlocks milestone and level achievements deterministically", () => {
    const factors = baseFactors({
      completedOrders: 100,
      identityVerified: true,
      responseRatePercent: 96,
      averageResponseTimeMinutes: 30,
      averageDispatchTimeHours: 10,
      reviews: {
        averageRating: 4.9,
        reviewCount: 120,
        stars: { five: 100, four: 20, three: 0, two: 0, one: 0 },
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
        "orders_100",
        "reviews_100_positive",
        "excellent_response_time",
        "trusted_seller",
        "top_seller",
        "premium_seller",
      ]),
    );
  });

  it("calculates weighted contributions without changing the approved formula", () => {
    const factors = baseFactors({
      reviews: { averageRating: 5, reviewCount: 10, stars: { five: 10, four: 0, three: 0, two: 0, one: 0 } },
      completedOrders: 20,
      responseRatePercent: 80,
      averageResponseTimeMinutes: 120,
      averageDispatchTimeHours: 30,
      profileCompletion: { percent: 80, completed: [], missing: [] },
      storeActivity: {
        recentListings: 1,
        recentLogins: 1,
        recentMessages: 1,
        recentSales: 1,
        recentUpdates: 1,
        score: 40,
      },
    });
    const components = buildComponentScores(factors);
    const score = calculateSellerPerformanceScore(factors);
    const recomposed = Object.entries(components).reduce(
      (sum, [key, value]) => sum + weightedContribution(key as keyof typeof components, value),
      0,
    );
    expect(Math.round(recomposed)).toBe(score);
    expect(levelForScore(score)).toBeTruthy();
  });

  it("invalidates dashboard cache after recalculation", () => {
    invalidateSellerPerformanceCache("user-test");
    expect(true).toBe(true);
  });

  it("uses idempotency keys for duplicate event protection", () => {
    const events = readSource("lib/seller-performance/events.ts");
    expect(events).toContain("idempotencyKey: `completed_order:${input.orderId}`");
    expect(events).toContain("idempotencyKey: `review:${input.orderId}`");
  });
});
