import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeUkComplianceAudit } from "@/lib/compliance/uk-audit";
import { LEGAL_DOCUMENT_SLUGS } from "@/lib/legal/canonical-documents";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 Master Production Audit", () => {
  it("locks production account hub Master Menu v2.0 (no dead-space cards)", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const snapshot = readSource("lib/account-center/snapshot.ts");

    expect(home).toContain('data-ac-hub-version="profile-v1"');
    expect(home).not.toContain("AccountWalletCard");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(profile).not.toContain("ac-canonical__followers-row");
    expect(profile).toContain("View Profile");
    expect(profile).not.toContain("Edit Profile");
    expect(profile).toContain("formatAccountProfileRating");
    expect(snapshot).toContain("listings");
    expect(snapshot).toContain("reviewCount");
    expect(snapshot).not.toContain("followers");
  });

  it("locks production settings hub inventory", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(settings).toContain("MyAccountTemplate");
    expect(settings).toContain("SettingsMenuSections");
    expect(menu).toContain('"Personal Information"');
    expect(menu).toContain('"Addresses"');
    expect(menu).toContain('"Currency & Region"');
    expect(menu).toContain("Help Centre");
    expect(menu).toContain("Legal Information");
    expect(menu).not.toContain("Identity Verification");
    expect(menu).not.toContain("Download My Data");
    expect(readSource("features/account-module/components/SettingsMenuSections.tsx")).toContain(
      "DeleteAccountFlow",
    );
  });

  it("locks production Balance hub as Wallet Production UI", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(hub).toContain('data-wallet-hub-version="v1.0-canonical"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain("Available Balance");
    expect(hub).not.toContain('title="Wallet"');
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Opening Balance");
  });

  it("locks Terms registration consent with Privacy + Cookie links (AUTH UI v1.2 · Phase C.1)", () => {
    const fields = readSource("features/auth/components/RegisterScreen.tsx");
    const actions = readSource("lib/auth/actions.ts");
    expect(fields).toContain('name="terms"');
    expect(fields).not.toContain('name="gdpr"');
    expect(fields).toContain("/legal/terms-and-conditions");
    expect(fields).toContain("/legal/privacy-policy");
    expect(fields).toContain("/legal/cookie-policy");
    expect(fields).not.toContain("copy.cookieLabel");
    expect(actions).toContain("marketing_emails");
    expect(actions).toContain('terms: z.literal("on"');
    expect(actions).not.toContain("formData.get(\"gdpr\")");
    expect(actions).not.toContain("gdpr: z.literal");
  });

  it("reports UK compliance readiness", () => {
    const summary = summarizeUkComplianceAudit();
    expect(summary.missing).toBe(0);
    expect(LEGAL_DOCUMENT_SLUGS.length).toBeGreaterThanOrEqual(21);
  });
});
