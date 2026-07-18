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

    expect(home).toContain('data-ac-hub-version="v2.0-master"');
    expect(home).not.toContain("AccountWalletCard");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(profile).toContain("ac-canonical__followers-row");
    expect(profile).not.toContain("View Public Profile");
    expect(profile).not.toContain("Edit Profile");
    expect(profile).toContain("formatAccountProfileRating");
    expect(snapshot).toContain("listings");
    expect(snapshot).toContain("reviewCount");
    expect(snapshot).toContain("followers");
  });

  it("locks production settings hub inventory", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(settings).toContain("AccountCanonicalShell");
    expect(settings).toContain("SettingsMenuSections");
    expect(menu).toContain('"Profile"');
    expect(menu).toContain('"Seller Performance"');
    expect(menu).toContain('"Wallet"');
    expect(menu).not.toContain("Identity Verification");
    expect(menu).not.toContain("Download My Data");
    expect(readSource("features/account-module/components/SettingsMenuSections.tsx")).toContain(
      "DeleteAccountFlow",
    );
  });

  it("locks production Personal Wallet Compact Premium hub", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(hub).toContain('data-wallet-ui="compact-premium"');
    expect(hub).toContain("PersonalWalletMenuSections");
    expect(hub).toContain("Available");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Opening Balance");
  });

  it("locks GDPR registration consent", () => {
    const fields = readSource("features/auth/components/RegisterScreen.tsx");
    const actions = readSource("lib/auth/actions.ts");
    expect(fields).toContain('name="gdpr"');
    expect(fields).toContain("/legal/cookie-policy");
    expect(fields).toContain("copy.cookieLabel");
    expect(actions).toContain("marketing_emails");
  });

  it("reports UK compliance readiness", () => {
    const summary = summarizeUkComplianceAudit();
    expect(summary.missing).toBe(0);
    expect(LEGAL_DOCUMENT_SLUGS.length).toBeGreaterThanOrEqual(21);
  });
});
