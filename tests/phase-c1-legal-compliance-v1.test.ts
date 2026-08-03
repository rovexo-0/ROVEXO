import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_LEGAL_DOCUMENTS,
  getLegalDocument,
  LEGAL_DOCUMENT_SLUGS,
  listLegalDocuments,
} from "@/lib/legal/canonical-documents";
import { PHASE_C1_LEGAL_COMPLIANCE_V1 } from "@/lib/legal/phase-c1-legal-compliance-v1";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function allLegalText(): string {
  return listLegalDocuments()
    .map((doc) => `${doc.title}\n${doc.summary}\n${doc.content}`)
    .join("\n");
}

describe("Phase C.1 — Legal & Compliance Alignment Lock", () => {
  it("locks Personal Account-only public legal SSOT", () => {
    expect(PHASE_C1_LEGAL_COMPLIANCE_V1.personalAccountOnly).toBe(true);
    expect(LEGAL_DOCUMENT_SLUGS).toHaveLength(25);
    expect(getLegalDocument("business-seller-terms")).toBeNull();
    expect(LEGAL_DOCUMENT_SLUGS).toContain("seller-terms");
    expect(LEGAL_DOCUMENT_SLUGS).toContain("verification-policy");
    expect(CANONICAL_LEGAL_DOCUMENTS.every((doc) => doc.content.length > 200)).toBe(true);
  });

  it("removes forbidden Business / admin / Following product claims from legal bodies", () => {
    const haystack = allLegalText();
    for (const phrase of PHASE_C1_LEGAL_COMPLIANCE_V1.forbiddenPublicLegalPhrases) {
      if (phrase === "Business Account") {
        // Negation wording must not use the forbidden product label either.
        expect(haystack).not.toMatch(/Business Account/i);
        continue;
      }
      expect(haystack, `forbidden phrase still present: ${phrase}`).not.toContain(phrase);
    }
    expect(haystack).toContain("Personal Account");
    expect(haystack).toContain("Holiday Mode");
    expect(haystack).toMatch(/Ratings?/);
    expect(haystack).toMatch(/Reviews?/);
  });

  it("names real cookie / storage identifiers in Cookie Policy", () => {
    const cookie = getLegalDocument("cookie-policy")?.content ?? "";
    expect(cookie).toContain("rovexo_cookie_consent_v1");
    expect(cookie).toContain("rovexo-locale");
    expect(cookie).toContain("sb-");
    expect(cookie).toMatch(/Accept/i);
  });

  it("redirects withdrawn Business Seller Terms slug and business policies route", () => {
    expect(readSource("next.config.ts")).toContain("/legal/business-seller-terms");
    expect(readSource("next.config.ts")).toContain("/legal/seller-terms");
    expect(readSource("app/(platform)/business/policies/page.tsx")).toContain('/legal/seller-terms');
    expect(readSource("app/(platform)/business/policies/page.tsx")).not.toContain("business-seller-terms");
  });

  it("wires Register legal acceptance to Terms, Privacy, and Cookie Policy", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    expect(register).toContain("/legal/terms-and-conditions");
    expect(register).toContain("/legal/privacy-policy");
    expect(register).toContain("/legal/cookie-policy");
  });

  it("keeps Account legal entry points on /legal SSOT via Settings", () => {
    const legalRows = buildSettingsMenuSections(null).find((s) => s.id === "legal")?.rows ?? [];
    expect(legalRows.map((r) => r.title)).toEqual(["Legal Information", "HMRC Reporting"]);
    expect(legalRows.map((r) => r.href)).toEqual(["/legal", "/seller/compliance"]);
    expect(readSource("lib/account-center/canonical-menu.ts")).not.toContain('href: "/legal"');
    expect(readSource("components/legal/CookieConsentBanner.tsx")).toContain("/legal/cookie-policy");
    expect(readSource("app/(platform)/account/settings/about/page.tsx")).toContain('redirect("/account/settings")');
  });

  it("Settings SUPPORT contains Help Centre only (no Contact Support row)", () => {
    const support = buildSettingsMenuSections(null).find((s) => s.id === "support");
    expect(support?.rows.map((r) => r.title)).toEqual(["Help Centre"]);
    expect(support?.rows.some((r) => r.title === "Contact Support")).toBe(false);
  });
});
