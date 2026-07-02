import { describe, expect, it } from "vitest";
import { createDefaultProtectionEngineDocument } from "@/lib/protection-engine/defaults";
import {
  PROTECTION_ENGINE_CASE_TYPES,
  PROTECTION_ENGINE_FILTERS,
  PROTECTION_ENGINE_MODULES,
  PROTECTION_ENGINE_TIMELINE_EVENTS,
  registerProtectionEngineModule,
} from "@/lib/protection-engine/registry";
import {
  buildCaseTimeline,
  deriveProtectionPhase,
  mapLegacyStatusToEnterprise,
  mapCaseToSummary,
} from "@/lib/protection-engine/timeline";
import { computeProtectionAnalytics } from "@/lib/protection-engine/reader";
import type { ProtectionCase } from "@/lib/protection/service";

describe("protection engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultProtectionEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.caseTypes.some((t) => t.id === "item-not-received" && t.enabled)).toBe(true);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.integrations.walletEngine).toBe(true);
    expect(doc.abuseDetection.duplicateClaims).toBe(true);
    expect(doc.protectionRules.beginsAfterPayment).toBe(true);
  });

  it("registers all core protection modules", () => {
    const ids = PROTECTION_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("disputes");
    expect(ids).toContain("evidence");
    expect(ids).toContain("analytics");
  });

  it("defines case types, filters, and timeline events", () => {
    expect(PROTECTION_ENGINE_CASE_TYPES.map((t) => t.id)).toContain("counterfeit");
    expect(PROTECTION_ENGINE_FILTERS.map((f) => f.id)).toContain("appealed");
    expect(PROTECTION_ENGINE_TIMELINE_EVENTS.map((e) => e.id)).toContain("wallet-update");
  });

  it("maps legacy case status to enterprise status", () => {
    expect(mapLegacyStatusToEnterprise("open")).toBe("submitted");
    expect(mapLegacyStatusToEnterprise("under_review")).toBe("admin-investigation");
    expect(mapLegacyStatusToEnterprise("appealed")).toBe("appealed");
  });

  it("maps case to summary", () => {
    const summary = mapCaseToSummary(
      {
        id: "c1",
        orderId: "o1",
        buyerId: "b1",
        sellerId: "s1",
        caseType: "dispute",
        status: "open",
        outcome: "pending",
        reason: "Item not received",
        description: "",
        refundAmount: null,
        adminNotes: "",
        appealReason: null,
        appealedAt: null,
        resolvedAt: null,
        createdAt: "2026-06-01T00:00:00Z",
      },
      "buyer",
    );
    expect(summary.enterpriseStatus).toBe("submitted");
    expect(summary.filterTags).toContain("open");
  });

  it("builds case timeline from events", () => {
    const caseRecord: ProtectionCase = {
      id: "c1",
      orderId: "o1",
      buyerId: "b1",
      sellerId: "s1",
      caseType: "dispute",
      status: "under_review",
      outcome: "pending",
      reason: "Damaged item",
      description: "",
      refundAmount: null,
      adminNotes: "",
      appealReason: null,
      appealedAt: null,
      resolvedAt: null,
      createdAt: "2026-06-01T00:00:00Z",
    };
    const timeline = buildCaseTimeline(caseRecord, [
      {
        id: "e1",
        caseId: "c1",
        actorId: "b1",
        eventType: "case_opened",
        message: "Opened",
        createdAt: "2026-06-01T00:00:00Z",
      },
    ]);
    expect(timeline.some((e) => e.id === "admin-review" && e.current)).toBe(true);
    expect(timeline.find((e) => e.id === "case-created")?.done).toBe(true);
  });

  it("derives protection phase from open cases", () => {
    expect(deriveProtectionPhase(2, 0)).toBe("review-period");
    expect(deriveProtectionPhase(1, 1)).toBe("disputed");
    expect(deriveProtectionPhase(0, 0)).toBe("activated");
  });

  it("computes analytics from cases", () => {
    const cases: ProtectionCase[] = [
      {
        id: "1",
        orderId: "o1",
        buyerId: "b1",
        sellerId: "s1",
        caseType: "refund",
        status: "resolved",
        outcome: "refund_full",
        reason: "Test",
        description: "",
        refundAmount: 50,
        adminNotes: "",
        appealReason: null,
        appealedAt: null,
        resolvedAt: "2026-06-05T00:00:00Z",
        createdAt: "2026-06-01T00:00:00Z",
      },
      {
        id: "2",
        orderId: "o2",
        buyerId: "b1",
        sellerId: "s1",
        caseType: "dispute",
        status: "open",
        outcome: "pending",
        reason: "Open",
        description: "",
        refundAmount: null,
        adminNotes: "",
        appealReason: null,
        appealedAt: null,
        resolvedAt: null,
        createdAt: "2026-06-02T00:00:00Z",
      },
    ];
    const analytics = computeProtectionAnalytics(cases);
    expect(analytics.openCases).toBe(1);
    expect(analytics.closedCases).toBe(1);
    expect(analytics.refundValue).toBe(50);
  });

  it("allows future module registration", () => {
    const next = registerProtectionEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "🛡️",
      description: "Future module",
      href: "/protection",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});
