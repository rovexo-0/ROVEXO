import { describe, expect, it } from "vitest";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { SETTINGS_MENU_ROW_TITLES } from "@/lib/settings/freeze";
import {
  LEGAL_CENTRE_CONSOLIDATION_V1,
  LEGAL_CENTRE_INDEX,
  LEGAL_CENTRE_REQUIRED_SLUGS,
} from "@/lib/legal/legal-centre-consolidation-v1";
import { getLegalDocument, LEGAL_DOCUMENT_SLUGS, listLegalDocuments } from "@/lib/legal/canonical-documents";
import { searchHelpCentre } from "@/lib/help/search";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Legal Centre Consolidation v1.0", () => {
  it("Settings LEGAL section contains Legal Information and HMRC Reporting", () => {
    const legal = buildSettingsMenuSections(null).find((section) => section.id === "legal");
    expect(legal?.rows.map((row) => row.title)).toEqual(["Legal Information", "HMRC Reporting"]);
    expect(legal?.rows[0]?.href).toContain("/legal");
    expect(legal?.rows[1]?.href).toContain("/seller/compliance");

    for (const title of LEGAL_CENTRE_CONSOLIDATION_V1.settingsForbiddenDuplicateTitles) {
      expect(SETTINGS_MENU_ROW_TITLES).not.toContain(title);
      expect(legal?.rows.some((row) => row.title === title)).toBe(false);
    }

    const support = buildSettingsMenuSections(null).find((section) => section.id === "support");
    expect(support?.rows.map((row) => row.title)).toEqual(["Help Centre"]);

    const account = buildSettingsMenuSections(null).find((section) => section.id === "account");
    expect(account?.rows.some((row) => row.title === "Accessibility")).toBe(false);
  });

  it("About ROVEXO is removed from Settings (version metadata stays internal)", () => {
    const sections = buildSettingsMenuSections(null);
    expect(sections.some((s) => s.id === "about" || s.title === "ABOUT")).toBe(false);
    expect(SETTINGS_MENU_ROW_TITLES).not.toContain("About ROVEXO");
    expect(sections.flatMap((s) => s.rows.map((r) => r.title))).not.toContain("About ROVEXO");

    const aboutRoute = readFileSync(
      join(process.cwd(), "app/(platform)/account/settings/about/page.tsx"),
      "utf8",
    );
    expect(aboutRoute).toContain('redirect("/account/settings")');
    expect(aboutRoute).not.toContain("SettingsAboutV1");

    // Internal version SSOT preserved for developers/admins.
    const version = readFileSync(join(process.cwd(), "lib/app/version.ts"), "utf8");
    expect(version).toContain("ROVEXO_APP_VERSION");
  });

  it("Legal Centre inventory includes every required canonical document with icons", () => {
    expect(LEGAL_CENTRE_REQUIRED_SLUGS).toHaveLength(25);
    expect(LEGAL_DOCUMENT_SLUGS).toHaveLength(25);

    for (const slug of LEGAL_CENTRE_REQUIRED_SLUGS) {
      expect(getLegalDocument(slug), slug).toBeTruthy();
    }

    expect(LEGAL_CENTRE_INDEX.every((entry) => entry.icon && entry.tone)).toBe(true);

    const ordered = listLegalDocuments();
    expect(ordered.map((doc) => doc.slug).slice(0, 25)).toEqual([...LEGAL_CENTRE_REQUIRED_SLUGS]);
  });

  it("Buyer/Seller Protection and GDPR do not duplicate fee or privacy bodies", () => {
    const buyerProtection = getLegalDocument("buyer-protection");
    const sellerProtection = getLegalDocument("seller-protection");
    const gdpr = getLegalDocument("gdpr-data-rights");
    const fee = getLegalDocument("platform-fee-policy");

    expect(buyerProtection?.content).toContain("/legal/platform-fee-policy");
    expect(sellerProtection?.content).toContain("Seller Fee = £0");
    expect(sellerProtection?.content).toContain("/legal/platform-fee-policy");
    expect(gdpr?.content).toContain("/legal/privacy-policy");
    expect(gdpr?.content).toMatch(/Do not paste the full Privacy Policy|always link/i);

    // Fee schedule remains only in Platform Fee Policy (buyer-paid / Seller Fee £0).
    expect(fee?.content).toMatch(/Seller Fee is £0/i);
    expect(fee?.content).toMatch(/paid by the \*\*buyer\*\*/i);
  });

  it("search indexes new Legal Centre documents", () => {
    expect(searchHelpCentre("Buyer Protection", 20).some((r) => r.href.includes("/legal/buyer-protection"))).toBe(
      true,
    );
    expect(searchHelpCentre("GDPR Data Rights", 20).some((r) => r.href.includes("/legal/gdpr-data-rights"))).toBe(
      true,
    );
    expect(searchHelpCentre("Legal Changelog", 20).some((r) => r.href.includes("/legal/legal-changelog"))).toBe(
      true,
    );
  });

  it("Legal index uses Settings icon family", () => {
    const source = readFileSync(join(process.cwd(), "features/legal/components/LegalIndexCanonical.tsx"), "utf8");
    expect(source).toContain("SettingsMenuIconGlyph");
    expect(source).toContain("getLegalCentreIcon");
  });
});
