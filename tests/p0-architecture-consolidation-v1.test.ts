import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { P0_ARCHITECTURE_CONSOLIDATION_V1 } from "@/lib/reputation/p0-architecture-consolidation-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("P0 Architecture Consolidation v1.0", () => {
  it("locks one badge engine and one reputation public API", () => {
    expect(P0_ARCHITECTURE_CONSOLIDATION_V1.badgeApi).toBe("/api/badges/[userId]");
    expect(P0_ARCHITECTURE_CONSOLIDATION_V1.reputationPublicApi).toBe(
      "/api/reputation/[userId]",
    );
    expect(P0_ARCHITECTURE_CONSOLIDATION_V1.rules.oneBadgeEngine).toBe(true);
    expect(P0_ARCHITECTURE_CONSOLIDATION_V1.rules.oneReputationPublicApi).toBe(true);
    expect(P0_ARCHITECTURE_CONSOLIDATION_V1.rules.sellerPerformanceNeverPublishesBadges).toBe(
      true,
    );
  });

  it("seller-performance public summary never maps achievements to badges", () => {
    const publicFn = readSource("lib/seller-performance/service.ts").split(
      "export async function getPublicSellerPerformanceSummary",
    )[1]?.split("export async function listSellerPerformanceAudit")[0] ?? "";
    expect(publicFn).toContain("badges: []");
    expect(publicFn).not.toContain("score.achievements.map");
  });

  it("legacy seller-performance public route redirects to reputation facade", () => {
    const route = readSource("app/api/seller/performance/[userId]/route.ts");
    expect(route).toContain("getReputationPublicProfile");
    expect(route).toContain('canonicalApi: "/api/reputation/[userId]"');
    expect(route).toContain("deprecated: true");
  });

  it("admin badge writes use Badge Engine canonical API", () => {
    const adminUi = readSource(
      "features/admin/components/SellerPerformanceAdminDashboard.tsx",
    );
    expect(adminUi).toContain('/api/admin/badges');
    expect(adminUi).toContain("BADGE_CATALOG");
    expect(adminUi).not.toContain("ACHIEVEMENT_DEFINITIONS");

    const adminRoute = readSource("app/api/admin/seller-performance/route.ts");
    expect(adminRoute).toContain("applyBadgeEmergencyOverride");
    expect(adminRoute).not.toContain("grantSellerPerformanceBadge");
  });

  it("seller performance page reads public badges from Badge Engine", () => {
    const page = readSource("app/seller/performance/page.tsx");
    expect(page).toContain("getPublicBadges");
    expect(existsSync(join(process.cwd(), "lib/badge/store.ts"))).toBe(true);
  });
});
