import { describe, expect, it } from "vitest";
import {
  BUMP_COOLDOWN_HOURS,
  BUMP_DURATIONS,
  computeEndsAt,
  FEATURE_DURATIONS,
  getPromotionDuration,
  MAX_BUMPS_PER_DAY,
} from "@/lib/promotions/config";
import {
  computePromotionScore,
  formatPromotionRemaining,
  isPromotionActive,
} from "@/lib/promotions/format";

describe("promotion config", () => {
  it("defines bump and feature pricing", () => {
    expect(BUMP_DURATIONS).toHaveLength(3);
    expect(FEATURE_DURATIONS).toHaveLength(3);
    expect(getPromotionDuration("bump", "24h")?.priceCents).toBe(199);
    expect(getPromotionDuration("feature", "7d")?.priceCents).toBe(999);
  });

  it("enforces bump limits configuration", () => {
    expect(BUMP_COOLDOWN_HOURS).toBeGreaterThan(0);
    expect(MAX_BUMPS_PER_DAY).toBeGreaterThan(0);
  });

  it("computes end dates from duration ids", () => {
    const start = new Date("2026-01-01T12:00:00Z");
    const bumpEnd = computeEndsAt("bump", "24h", start);
    expect(bumpEnd?.getTime()).toBe(start.getTime() + 24 * 60 * 60 * 1000);

    const featureEnd = computeEndsAt("feature", "7d", start);
    expect(featureEnd?.getUTCDate()).toBe(8);
  });
});

describe("promotion scoring", () => {
  it("scores featured listings highest", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(computePromotionScore(1, future, future)).toBeGreaterThan(computePromotionScore(1, future, null));
  });

  it("detects active promotions and remaining time", () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(isPromotionActive(future)).toBe(true);
    expect(formatPromotionRemaining(future)).toMatch(/left/);
    expect(isPromotionActive(null)).toBe(false);
  });
});

describe("promotion modules", () => {
  it("exports service and admin helpers", async () => {
    const service = await import("@/lib/promotions/service");
    const admin = await import("@/lib/promotions/admin");
    const analytics = await import("@/lib/promotions/analytics");

    expect(service.createPromotionCheckoutSession).toBeTypeOf("function");
    expect(service.fulfillPromotionFromStripeSession).toBeTypeOf("function");
    expect(admin.listAdminPromotions).toBeTypeOf("function");
    expect(admin.adminRefundPromotion).toBeTypeOf("function");
    expect(analytics.recordPromotionAnalyticsEvent).toBeTypeOf("function");
  });
});
