import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { REPUTATION_ENGINE_V1 } from "@/lib/reputation/reputation-engine-v1";
import {
  assertNoInternalScoreInPublicPayload,
  REPUTATION_PUBLIC_FIELDS,
} from "@/lib/reputation/public-contract";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Reputation Engine v1.0 — Absolute Blood Code", () => {
  it("locks one engine · one store · one API · calculated-only law", () => {
    expect(REPUTATION_ENGINE_V1.version).toBe("1.0");
    expect(REPUTATION_ENGINE_V1.implementation).toBe("lib/seller-performance");
    expect(REPUTATION_ENGINE_V1.store).toBe("lib/reputation/store.ts");
    expect(REPUTATION_ENGINE_V1.apiPath).toBe("/api/reputation/[userId]");
    expect(REPUTATION_ENGINE_V1.absoluteLaw).toBe(
      "REPUTATION_IS_CALCULATED_NEVER_MANUALLY_EDITED",
    );
    expect(REPUTATION_ENGINE_V1.rules.oneEngine).toBe(true);
    expect(REPUTATION_ENGINE_V1.rules.calculatedOnly).toBe(true);
    expect(REPUTATION_ENGINE_V1.rules.noManualAdminScoreEdit).toBe(true);
    expect(REPUTATION_ENGINE_V1.rules.eventDriven).toBe(true);
    expect(REPUTATION_ENGINE_V1.neverPublic).toContain("internalScore");
    expect(REPUTATION_ENGINE_V1.publicDisplay).toContain("averageRating");
    expect(REPUTATION_ENGINE_V1.publicDisplay).toContain("totalReviews");
    expect(REPUTATION_ENGINE_V1.publicDisplay).toContain("completedOrders");
    expect(REPUTATION_ENGINE_V1.consumers.badgeEngine).toBe("signals_only");
    expect(REPUTATION_ENGINE_V1.doesNotModify).toContain("Rating Engine");
    expect(REPUTATION_ENGINE_V1.doesNotModify).toContain("Reviews Engine");
  });

  it("public contract blocks internal scores", () => {
    expect(REPUTATION_PUBLIC_FIELDS).toContain("averageRating");
    expect(
      assertNoInternalScoreInPublicPayload({
        userId: "x",
        averageRating: 4.9,
        totalReviews: 10,
      }),
    ).toBe(true);
    expect(assertNoInternalScoreInPublicPayload({ score: 88, userId: "x" })).toBe(false);
    expect(
      assertNoInternalScoreInPublicPayload({ internalScore: 88, userId: "x" }),
    ).toBe(false);
  });

  it("store is a facade over seller-performance — no second formula", () => {
    expect(existsSync(join(process.cwd(), "lib/reputation/store.ts"))).toBe(true);
    const store = readSource("lib/reputation/store.ts");
    expect(store).toContain("@/lib/seller-performance/service");
    expect(store).toContain("getReputationPublicProfile");
    expect(store).toContain("getPublicBadges");
    expect(store).toContain("getReputationInternalProfile");
    expect(store).toContain("getReputationSignalsForBadges");
    expect(store).toContain("getReputationSignalsForSearch");
    expect(store).toContain("getReputationSignalsForFraud");
    expect(store).not.toContain("adminSet");
    expect(store).not.toContain("manualScore");
    expect(existsSync(join(process.cwd(), "lib/reputation/scoring-v2.ts"))).toBe(false);
  });

  it("ships one public reputation API without internal score fields", () => {
    const api = readSource("app/api/reputation/[userId]/route.ts");
    expect(api).toContain("getReputationPublicProfile");
    expect(api).toContain("assertNoInternalScoreInPublicPayload");
    expect(api).toContain("averageRating");
    expect(api).toContain("totalReviews");
    expect(api).toContain("completedOrders");
    expect(api).toContain("verificationStatus");
    expect(api).toContain("publicBadges");
    expect(api).not.toContain("internalScore");
    expect(api).not.toContain("fraudScore");
  });

  it("preserves certified seller-performance + rating + reviews engines", () => {
    expect(existsSync(join(process.cwd(), "lib/seller-performance/service.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib/rating/rating-engine-v1.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib/reviews/reviews-engine-v1.ts"))).toBe(true);
    const xlvi = readSource("lib/supreme-blood-code-xlvi-follow-rating-badge-v1.ts");
    expect(xlvi).toContain('reputationEngine: "seller-performance"');
  });
});
