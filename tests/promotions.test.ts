import { describe, expect, it } from "vitest";
import {
  BUMP_DURATIONS,
  FEATURE_DURATIONS,
  computeEndsAt,
  getBumpDuration,
  getFeatureDuration,
} from "@/lib/promotions/config";
import {
  computePromotionScore,
  formatPromotionRemaining,
  isPromotionActive,
} from "@/lib/promotions/format";

describe("promotion config", () => {
  it("defines bump and feature durations", () => {
    expect(BUMP_DURATIONS.map((option) => option.id)).toEqual(["24h", "3d", "7d"]);
    expect(FEATURE_DURATIONS.map((option) => option.id)).toEqual(["7d", "14d", "30d"]);
  });

  it("computes bump end times in hours", () => {
    const from = new Date("2026-06-20T12:00:00.000Z");
    const endsAt = computeEndsAt("bump", "24h", from);
    expect(endsAt?.toISOString()).toBe("2026-06-21T12:00:00.000Z");
  });

  it("computes feature end times in days", () => {
    const from = new Date("2026-06-20T12:00:00.000Z");
    const endsAt = computeEndsAt("feature", "7d", from);
    expect(endsAt?.toISOString()).toBe("2026-06-27T12:00:00.000Z");
  });

  it("resolves duration options by id", () => {
    expect(getBumpDuration("3d")?.hours).toBe(72);
    expect(getFeatureDuration("30d")?.days).toBe(30);
  });
});

describe("promotion format", () => {
  it("detects active promotions", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();

    expect(isPromotionActive(future)).toBe(true);
    expect(isPromotionActive(past)).toBe(false);
    expect(isPromotionActive(null)).toBe(false);
  });

  it("formats remaining promotion time", () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString();
    expect(formatPromotionRemaining(inTwoHours)).toMatch(/^2h \d+m left$/);
  });

  it("computes promotion score from active promotions", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();

    expect(computePromotionScore(2, future, future)).toBe(1520);
    expect(computePromotionScore(2, past, future)).toBe(1000);
    expect(computePromotionScore(2, future, past)).toBe(520);
    expect(computePromotionScore(2, past, past)).toBe(0);
  });
});
