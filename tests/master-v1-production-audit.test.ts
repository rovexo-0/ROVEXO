import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeUkComplianceAudit } from "@/lib/compliance/uk-audit";
import { LEGAL_DOCUMENT_SLUGS } from "@/lib/legal/canonical-documents";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 Master Production Audit", () => {
  it("locks production account hub Module 02 (no profile CTAs)", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const stats = readSource("features/account-center/components/AccountStatsStrip.tsx");
    const snapshot = readSource("lib/account-center/snapshot.ts");

    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).not.toContain("AccountWalletCard");
    expect(home).toContain("AccountStatsStrip");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(stats).toContain("Listings");
    expect(stats).toContain("Saved");
    expect(stats).toContain("Orders");
    expect(stats).toContain("Wallet");
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
    expect(menu).toContain('"Email"');
    expect(menu).toContain('"Delete Account"');
    expect(menu).toContain('"Payment Methods"');
    expect(menu).toContain('"Help Centre"');
    expect(menu).toContain("Download My Data");
    expect(menu).not.toContain("Appearance");
    expect(menu).not.toContain("Identity Verification");
    expect(readSource("features/account-module/components/SettingsMenuSections.tsx")).toContain(
      "DeleteAccountFlow",
    );
  });

  it("locks production wallet earnings and statement exports", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const insights = readSource("features/wallet/components/WalletInsights.tsx");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(hub).toContain('data-wallet-ui="v1.2-simplified"');
    expect(hub).toContain("Available Balance");
    expect(insights).toContain("This Month");
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
