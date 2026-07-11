import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeUkComplianceAudit } from "@/lib/compliance/uk-audit";
import { LEGAL_DOCUMENT_SLUGS } from "@/lib/legal/canonical-documents";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 Master Production Audit", () => {
  it("locks production account hub with live wallet card and 8 stats", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const stats = readSource("features/account-center/components/AccountStatsStrip.tsx");
    const walletCard = readSource("features/account-center/components/AccountWalletCard.tsx");
    const snapshot = readSource("lib/account-center/snapshot.ts");

    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).toContain("AccountWalletCard");
    expect(stats).toContain("Followers");
    expect(stats).toContain("Following");
    expect(stats).toContain("reviewCount");
    expect(snapshot).toContain("following");
  });

  it("locks production settings hub inventory", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    expect(settings).toContain('data-settings-version="v1.0-production"');
    expect(settings).toContain("Tax Information");
    expect(settings).toContain("Download My Data");
    expect(settings).toContain("Cookie Preferences");
    expect(settings).toContain("DeleteAccountFlow");
  });

  it("locks production wallet earnings and statement exports", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(hub).toContain("Monthly Earnings");
    expect(hub).toContain("Lifetime Earnings");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Opening Balance");
  });

  it("locks GDPR registration consent", () => {
    const fields = readSource("features/auth/components/RegisterFields.tsx");
    const actions = readSource("lib/auth/actions.ts");
    expect(fields).toContain('name="gdpr"');
    expect(fields).toContain("Cookie Policy");
    expect(actions).toContain("marketing_emails");
  });

  it("reports UK compliance readiness", () => {
    const summary = summarizeUkComplianceAudit();
    expect(summary.missing).toBe(0);
    expect(LEGAL_DOCUMENT_SLUGS.length).toBeGreaterThanOrEqual(21);
  });
});
