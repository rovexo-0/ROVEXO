import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PROMOTION_COOLDOWN_HOURS,
  PROMOTION_PRIORITY_DAY1,
  applyAntiMonopolyRotation,
  computeOwnerPriorityScore,
  computeTimeDecayPromotionScore,
  isPromotionPurchaseBlocked,
  promotionsFinalFreezeSnapshot,
  toStoredPromotionScore,
} from "@/lib/promotions/boost-time-decay-v1";
import { BUMP_COOLDOWN_HOURS } from "@/lib/promotions/config";
import { computePromotionScore } from "@/lib/promotions/format";

describe("promotions final freeze v1.0", () => {
  it("locks CEO freeze metadata", () => {
    const snap = promotionsFinalFreezeSnapshot();
    expect(snap.status).toContain("LOCKED");
    expect(snap.timezone).toBe("Europe/London");
    expect(snap.cooldownHours).toBe(24);
    expect(BUMP_COOLDOWN_HOURS).toBe(24);
    expect(PROMOTION_COOLDOWN_HOURS).toBe(24);
  });

  it("boost 7d curve: 100 → 90 → … → 40", () => {
    const start = "2026-07-01T10:00:00.000Z";
    const until = "2026-07-08T10:00:00.000Z";
    const scores = [0, 1, 2, 3, 4, 5, 6].map((elapsed) => {
      const now = new Date(Date.parse(start) + elapsed * 24 * 60 * 60 * 1000 + 3_600_000);
      return computeOwnerPriorityScore({
        kind: "boost",
        startedAt: start,
        until,
        now,
      });
    });
    expect(scores).toEqual([100, 90, 80, 70, 60, 50, 40]);
  });

  it("bump 3d curve: 100 → 70 → 40", () => {
    const start = "2026-07-01T10:00:00.000Z";
    const until = "2026-07-04T10:00:00.000Z";
    const scores = [0, 1, 2].map((elapsed) => {
      const now = new Date(Date.parse(start) + elapsed * 24 * 60 * 60 * 1000 + 3_600_000);
      return computeOwnerPriorityScore({
        kind: "bump",
        startedAt: start,
        until,
        now,
      });
    });
    expect(scores).toEqual([100, 70, 40]);
  });

  it("store 30d curve starts at 100 and ends at 1", () => {
    const start = "2026-07-01T10:00:00.000Z";
    const until = "2026-07-31T10:00:00.000Z";
    const day1 = computeOwnerPriorityScore({
      kind: "store",
      startedAt: start,
      until,
      now: new Date("2026-07-01T18:00:00.000Z"),
    });
    const day30 = computeOwnerPriorityScore({
      kind: "store",
      startedAt: start,
      until,
      now: new Date("2026-07-30T18:00:00.000Z"),
    });
    expect(day1).toBe(100);
    expect(day30).toBe(1);
  });

  it("expired promotions return organic zero", () => {
    expect(
      computeTimeDecayPromotionScore({
        bumpedUntil: "2026-01-01T00:00:00.000Z",
        lastBumpedAt: "2025-12-25T00:00:00.000Z",
        now: new Date("2026-01-02T00:00:00.000Z"),
      }),
    ).toBe(0);
  });

  it("bumpCount cannot inflate score", () => {
    const future = "2099-01-08T00:00:00.000Z";
    const start = "2099-01-01T00:00:00.000Z";
    expect(computePromotionScore(1, future, null, start, null, 168)).toBe(
      computePromotionScore(99, future, null, start, null, 168),
    );
    expect(computePromotionScore(1, future, null, start, null, 168)).toBe(
      toStoredPromotionScore(PROMOTION_PRIORITY_DAY1),
    );
  });

  it("blocks purchase while active and during 24h cooldown", () => {
    const active = isPromotionPurchaseBlocked({
      until: "2099-01-01T00:00:00.000Z",
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(active.blocked).toBe(true);
    expect(active.reason).toBe("active");

    const cooldown = isPromotionPurchaseBlocked({
      until: "2026-07-01T00:00:00.000Z",
      now: new Date("2026-07-01T12:00:00.000Z"),
    });
    expect(cooldown.blocked).toBe(true);
    expect(cooldown.reason).toBe("cooldown");

    const open = isPromotionPurchaseBlocked({
      until: "2026-06-01T00:00:00.000Z",
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(open.blocked).toBe(false);
  });

  it("anti-monopoly prevents one seller owning top 5 when others are promoted", () => {
    const rotated = applyAntiMonopolyRotation([
      { id: "a1", sellerId: "A", promotionScore: 100_000 },
      { id: "a2", sellerId: "A", promotionScore: 99_000 },
      { id: "a3", sellerId: "A", promotionScore: 98_000 },
      { id: "a4", sellerId: "A", promotionScore: 97_000 },
      { id: "a5", sellerId: "A", promotionScore: 96_000 },
      { id: "b1", sellerId: "B", promotionScore: 95_000 },
      { id: "c1", sellerId: "C", promotionScore: 94_000 },
    ]);
    const top5Sellers = rotated.slice(0, 5).map((item) => item.sellerId);
    expect(top5Sellers).toContain("B");
    expect(top5Sellers).toContain("C");
    expect(top5Sellers.filter((id) => id === "A").length).toBeLessThan(5);
  });

  it("service hard-blocks stack instead of extending #1", () => {
    const service = readFileSync(path.join(process.cwd(), "lib/promotions/service.ts"), "utf8");
    expect(service).toContain("isPromotionPurchaseBlocked");
    expect(service).toContain("anti-stack: BLOCK");
    expect(service).not.toContain("never stack uninterrupted #1.\n  // Active window → queue");
  });

  it("ships Final Freeze SQL migration", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260721190000_promotions_final_freeze_v1.sql"),
      "utf8",
    );
    expect(sql).toContain("Europe/London");
    expect(sql).toContain("100 - bump_elapsed * 10");
    expect(sql).toContain("100 - bump_elapsed * 30");
  });
});
