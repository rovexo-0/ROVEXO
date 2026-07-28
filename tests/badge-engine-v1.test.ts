import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { BADGE_CATALOG, BADGE_ENGINE_V1 } from "@/lib/badge/badge-engine-v1";
import { evaluateBadgeRules } from "@/lib/badge/rules";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Badge Engine v1.0 — Absolute Blood Code", () => {
  it("locks one engine · one store · one API · earned-only law", () => {
    expect(BADGE_ENGINE_V1.version).toBe("1.0");
    expect(BADGE_ENGINE_V1.store).toBe("lib/badge/store.ts");
    expect(BADGE_ENGINE_V1.apiPath).toBe("/api/badges/[userId]");
    expect(BADGE_ENGINE_V1.consumes).toBe("lib/reputation/store.ts");
    expect(BADGE_ENGINE_V1.absoluteLaw).toBe("BADGES_ARE_EARNED_NEVER_MANUALLY_AWARDED");
    expect(BADGE_ENGINE_V1.rules.automaticAssignment).toBe(true);
    expect(BADGE_ENGINE_V1.rules.automaticRemoval).toBe(true);
    expect(BADGE_ENGINE_V1.rules.noReputationCalculation).toBe(true);
    expect(BADGE_ENGINE_V1.rules.superAdminEmergencyOverrideOnly).toBe(true);
    expect(BADGE_ENGINE_V1.doesNotModify).toContain("Reputation Engine");
    expect(BADGE_ENGINE_V1.doesNotModify).toContain("Rating Engine");
  });

  it("catalog covers Owner badges with tooltips", () => {
    expect(BADGE_CATALOG.verified_seller.label).toBe("Verified Seller");
    expect(BADGE_CATALOG.verified_business.label).toBe("Verified Business");
    expect(BADGE_CATALOG.trusted_seller.label).toBe("Trusted Seller");
    expect(BADGE_CATALOG.top_seller.label).toBe("Top Seller");
    expect(BADGE_CATALOG.fast_shipper.label).toBe("Fast Shipper");
    expect(BADGE_CATALOG.fast_responder.label).toBe("Fast Responder");
    expect(BADGE_CATALOG.reliable_buyer.label).toBe("Reliable Buyer");
    expect(BADGE_CATALOG.trusted_buyer.label).toBe("Trusted Buyer");
    expect(BADGE_CATALOG.community_contributor.status).toBe("future");
    expect(BADGE_CATALOG.verified_seller.tooltip.length).toBeGreaterThan(5);
  });

  it("evaluates rules from reputation signals only", () => {
    const earned = evaluateBadgeRules({
      identityVerified: true,
      businessVerified: true,
      averageRating: 4.9,
      totalReviews: 30,
      completedOrders: 60,
      cancellationRatePercent: 2,
      validatedReports: 0,
      responseRatePercent: 95,
      averageResponseTimeMinutes: 30,
      averageDispatchTimeHours: 12,
      internalScore: 85,
      level: "platinum",
      completedPurchases: 25,
    });
    expect(earned).toContain("verified_seller");
    expect(earned).toContain("verified_business");
    expect(earned).toContain("trusted_seller");
    expect(earned).toContain("top_seller");
    expect(earned).toContain("fast_shipper");
    expect(earned).toContain("fast_responder");
    expect(earned).toContain("reliable_buyer");
    expect(earned).toContain("trusted_buyer");
    expect(earned).not.toContain("community_contributor");
  });

  it("removes badges when requirements fail", () => {
    const earned = evaluateBadgeRules({
      identityVerified: false,
      businessVerified: false,
      averageRating: 3,
      totalReviews: 1,
      completedOrders: 1,
      cancellationRatePercent: 40,
      validatedReports: 3,
      responseRatePercent: 10,
      averageResponseTimeMinutes: 1000,
      averageDispatchTimeHours: 72,
      internalScore: 10,
      level: "bronze",
      completedPurchases: 0,
    });
    expect(earned).toEqual([]);
  });

  it("store consumes Reputation Engine and never recalculates reputation", () => {
    const store = readSource("lib/badge/store.ts");
    expect(store).toContain("@/lib/reputation/store");
    expect(store).toContain("getReputationSignalsForBadges");
    expect(store).toContain("evaluateBadgeRules");
    expect(store).toContain("applyBadgeEmergencyOverride");
    expect(store).toContain("BadgeOverrideApplied");
    expect(store).not.toContain("recalculateSellerPerformance");
    expect(store).not.toContain("createOrderReview");
  });

  it("ships public + admin APIs and migration", () => {
    expect(existsSync(join(process.cwd(), "app/api/badges/[userId]/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/api/admin/badges/route.ts"))).toBe(true);
    const admin = readSource("app/api/admin/badges/route.ts");
    expect(admin).toContain("requireApiSuperAdmin");
    expect(admin).toContain("applyBadgeEmergencyOverride");
    const sql = readSource("supabase/migrations/20260727020000_badge_engine_v1.sql");
    expect(sql).toContain("badge_overrides");
    expect(sql).toContain("badge_audit_log");
  });

  it("forbids parallel badge engines", () => {
    expect(existsSync(join(process.cwd(), "lib/badge/badge-engine-v2.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/badge/store-v2.ts"))).toBe(false);
  });
});
