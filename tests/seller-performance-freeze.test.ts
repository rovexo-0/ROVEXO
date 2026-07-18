import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECALCULATION_TRIGGERS,
  SELLER_PERFORMANCE_CANONICAL_FROZEN,
  SELLER_PERFORMANCE_CANONICAL_STATUS,
} from "@/lib/seller-performance/master-spec";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Seller Performance v1.0 — CANONICAL FREEZE", () => {
  it("marks the module as canonical frozen", () => {
    expect(SELLER_PERFORMANCE_CANONICAL_FROZEN).toBe(true);
    expect(SELLER_PERFORMANCE_CANONICAL_STATUS).toBe("CANONICAL_FROZEN_v1.0");
  });

  it("locks account summary card as Master Menu rows and keeps hub Compact Premium", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");

    expect(card).toContain("CanonicalMenuRow");
    expect(card).toContain('href="/seller/performance"');
    expect(card).not.toContain("AccountSellerScoreRing");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).toContain("AccountMenuSections");
  });

  it("locks seller dashboard sections for Absolute Final Master Menu", () => {
    const dashboard = readSource("features/seller-performance/components/SellerPerformanceDashboardView.tsx");
    const history = readSource("features/seller-performance/components/SellerPerformanceHistorySection.tsx");

    expect(dashboard).toContain('data-seller-performance="v2.0-standard"');
    expect(dashboard).toContain("AccountCanonicalShell");
    expect(dashboard).toContain("CanonicalMenuRow");
    expect(dashboard).toContain("Score");
    expect(dashboard).toContain("Factors");
    expect(dashboard).toContain("Changes");
    expect(dashboard).toContain("Achievements");
    expect(dashboard).toContain("Trend");
    expect(dashboard).not.toContain("Your Reputation Engine");
    expect(history).toContain("30 Days");
    expect(history).toContain("90 Days");
    expect(history).toContain("1 Year");
    expect(history).toContain("All Time");
  });

  it("wires all required marketplace recalculation events", () => {
    const events = readSource("lib/seller-performance/events.ts");

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
      ]),
    );

    expect(events).toContain("onSellerOrderCompleted");
    expect(events).toContain("onSellerOrderCancelled");
    expect(events).toContain("onSellerOrderRefunded");
    expect(events).toContain("onSellerDispatch");
    expect(events).toContain("onSellerReview");
    expect(events).toContain("onSellerMessageReply");
    expect(events).toContain("onSellerValidatedReport");
    expect(events).toContain("onSellerIdentityVerified");
    expect(events).toContain("onSellerEmailVerified");
    expect(events).toContain("onSellerPhoneVerified");
    expect(events).toContain("onSellerBusinessVerified");
  });

  it("exposes buyer-safe public profile fields only", () => {
    const route = readSource("app/api/seller/performance/[userId]/route.ts");
    const publicFn = readSource("lib/seller-performance/service.ts").split(
      "export async function getPublicSellerPerformanceSummary",
    )[1]?.split("export async function listSellerPerformanceAudit")[0] ?? "";

    expect(route).toContain("level");
    expect(route).toContain("averageRating");
    expect(route).toContain("badges");
    expect(route).toContain("completedSales");
    expect(route).toContain("verified");
    expect(route).not.toMatch(/score:\s*summary\.score/);
    expect(publicFn).not.toContain("componentScores");
    expect(publicFn).not.toContain("factorBreakdown");
    expect(publicFn).not.toContain("seller_performance_audit");
  });

  it("reads stored engine values on account and dashboard (no client-side scoring)", () => {
    const summary = readSource("lib/account-center/seller-performance-summary.ts");
    const page = readSource("app/seller/performance/page.tsx");
    const dashboardService = readSource("lib/seller-performance/service.ts").split(
      "export async function getSellerPerformanceDashboard",
    )[1]?.split("export async function getPublicSellerPerformanceSummary")[0] ?? "";

    expect(summary).toContain("getSellerPerformanceScore");
    expect(summary).not.toContain("calculateSellerPerformanceScore");
    expect(page).toContain("getSellerPerformanceDashboard");
    expect(dashboardService).not.toContain("recalculateSellerPerformanceInternal");
  });
});
