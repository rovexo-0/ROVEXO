import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeUkComplianceAudit } from "@/lib/compliance/uk-audit";
import { LEGAL_DOCUMENT_SLUGS } from "@/lib/legal/canonical-documents";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 Master Production Audit", () => {
  it("locks production account hub with live wallet card and 4 primary stats", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const stats = readSource("features/account-center/components/AccountStatsStrip.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const snapshot = readSource("lib/account-center/snapshot.ts");

    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).not.toContain("AccountWalletCard");
    expect(stats).toContain("Listings");
    expect(stats).toContain("Saved");
    expect(stats).toContain("Orders");
    expect(stats).toContain("Wallet");
    expect(stats).not.toContain("Following");
    expect(stats).not.toContain("SOCIAL_STATS");
    expect(stats).not.toContain("ac-canonical__stats--secondary");
    expect(profile).toContain("ac-canonical__followers-row");
    expect(profile).toContain("ac-canonical__rating");
    expect(profile).toContain("formatAccountProfileRating");
    expect(profile).not.toContain("⭐ —");
    expect(snapshot).toContain("followers");
    expect(readSource("lib/account-center/canonical-menu.ts")).toContain("Promotion Tools");
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

  it("locks production wallet earnings and statement exports", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const insights = readSource("features/wallet/components/WalletInsights.tsx");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(hub).toContain('data-wallet-ui="v1.1-simplified"');
    expect(hub).toContain("Paid Out");
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
