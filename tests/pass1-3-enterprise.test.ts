import { describe, expect, it } from "vitest";
import { listBusinessDirectory } from "@/lib/business/directory";
import { listHelpFaqs, searchHelpFaqs } from "@/lib/help/faq";
import { listHelpPolicies } from "@/lib/help/policies";
import { listHelpProcessingTimes } from "@/lib/help/processing-times";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";
import { buildTrustBadges } from "@/lib/trust/service";
import { TRUST_CENTER_SECTIONS } from "@/lib/trust/types";

describe("pass 1-3 enterprise systems", () => {
  it("pass 1: exposes help center content surfaces", () => {
    expect(HELP_TOPICS.length).toBeGreaterThanOrEqual(40);
    expect(listHelpFaqs().length).toBeGreaterThan(0);
    expect(listHelpPolicies().length).toBeGreaterThan(0);
    expect(listHelpProcessingTimes().length).toBeGreaterThan(0);
    expect(searchHelpFaqs("withdraw").length).toBeGreaterThan(0);
    expect(getDecisionTree("withdraw")?.rootNodeId).toBe("root");
  });

  it("pass 2: defines trust center protection and verification coverage", () => {
    expect(TRUST_CENTER_SECTIONS.some((section) => section.id === "business-protection")).toBe(true);
    expect(TRUST_CENTER_SECTIONS.some((section) => section.id === "disputes")).toBe(true);
    const badges = buildTrustBadges(
      {
        userId: "user-1",
        score: 70,
        buyerScore: 65,
        sellerScore: 72,
        businessScore: 68,
        level: "verified",
        tier: "gold",
        scoreLocked: false,
        lockReason: null,
        factors: null,
        recommendations: [],
        updatedAt: new Date().toISOString(),
        lastRecalculatedAt: null,
      },
      [{ id: "1", userId: "user-1", verificationType: "identity", status: "approved", level: "verified", documentUrls: [], reviewedAt: null, expiresAt: null }],
      true,
    );
    expect(badges).toContain("Trusted Buyer");
  });

  it("pass 3: exposes business directory query surface", async () => {
    const companies = await listBusinessDirectory();
    expect(Array.isArray(companies)).toBe(true);
  });
});
