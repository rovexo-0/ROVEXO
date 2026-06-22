import { describe, expect, it } from "vitest";
import { computeRiskLevel, computeRiskScore, requiresModerationQueue } from "@/lib/moderation/risk";

describe("moderation risk scoring", () => {
  it("scores prohibited content as critical", () => {
    const hits = [{ category: "firearms" as const, term: "handgun", weight: 1 }];
    const level = computeRiskLevel(hits, "blocked");
    expect(level).toBe("critical");
    expect(computeRiskScore(hits)).toBeGreaterThanOrEqual(90);
    expect(requiresModerationQueue(level)).toBe(true);
  });

  it("scores knives as high", () => {
    const hits = [{ category: "knives" as const, term: "combat knife", weight: 0.75 }];
    expect(computeRiskLevel(hits, "warning")).toBe("high");
  });

  it("scores spam as medium", () => {
    const hits = [{ category: "spam" as const, term: "click here", weight: 0.6 }];
    expect(computeRiskLevel(hits, "warning")).toBe("medium");
    expect(requiresModerationQueue("medium")).toBe(false);
  });

  it("returns low for approved content", () => {
    expect(computeRiskLevel([], "approved")).toBe("low");
  });
});
