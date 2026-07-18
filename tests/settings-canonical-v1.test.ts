import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Settings canonical v1.0 hub", () => {
  it("uses flat sections with canonical menu rows (no accordion)", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("AccountCanonicalShell");
    expect(settings).toContain("showHeaderTitle");
    expect(settings).toContain("Manage your account and preferences");
    expect(settings).toContain("SettingsMenuSections");
    expect(settings).not.toContain("SettingsAccordion");
    expect(sections).toContain('data-settings-canonical="v1.0"');
    expect(sections).toContain("CanonicalMenuRow");
    expect(sections).toContain("settings-canonical__danger-card");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).toContain("dangerRow");
  });

  it("defines all canonical sections and routes", () => {
    const sections = buildSettingsMenuSections(null);
    const titles = sections.map((section) => section.title);

    expect(titles).toEqual([
      "ACCOUNT",
      "SECURITY",
      "MARKETPLACE",
      "PREFERENCES",
      "LEGAL",
    ]);

    const rowTitles = sections.flatMap((section) => section.rows.map((row) => row.title));
    expect(rowTitles).toEqual([
      "Profile",
      "Addresses",
      "Payment Methods",
      "Notifications",
      "ROVEXO Ideas",
      "Privacy & Security",
      "Connected Accounts",
      "Devices & Sessions",
      "Blocked Users",
      "Business Verification",
      "Seller Performance",
      "Promotion Tools",
      "Wallet",
      "Preferences",
      "Language & Currency",
      "Accessibility",
      "Terms & Policies",
      "About ROVEXO",
    ]);

    const hrefs = sections.flatMap((section) => section.rows.map((row) => row.href));
    expect(hrefs).toContain("/account/profile");
    expect(hrefs).toContain("/account/addresses");
    expect(hrefs).toContain("/wallet/payment-methods");
    expect(hrefs).toContain("/notifications/settings");
    expect(hrefs).toContain("/account/security");
    expect(hrefs).toContain("/account/blocked-users");
    expect(hrefs).toContain("/trust");
    expect(hrefs).toContain("/seller/performance");
    expect(hrefs).toContain("/account/promotion-tools");
    expect(hrefs).toContain("/wallet");
    expect(hrefs).toContain("/account/buyer/preferences");
    expect(hrefs).not.toContain("/account/preferences/appearance");
    expect(hrefs).toContain("/account/preferences/language");
    expect(hrefs).toContain("/legal/accessibility-statement");
    expect(hrefs).toContain("/legal");
    expect(hrefs).toContain("/account/settings/about");
  });

  it("uses outline icons only in settings rows", () => {
    const icon = readSource("features/account-module/components/SettingsMenuIcon.tsx");
    expect(icon).toContain("RvxLineIcons");
    expect(icon).not.toContain("AccountIcon");
    expect(icon).not.toContain("createFluencyFeatureIcon");
  });

  it("locks canonical settings layout tokens", () => {
    const css = readSource("styles/rovexo/account-settings-canonical.css");
    expect(css).toContain("--cds-row-min-height: 64px");
    expect(css).toContain("--cds-row-padding-x: 16px");
    expect(css).toContain("--cds-space-section-gap: 24px");
    expect(css).toContain("--cds-color-divider: #efefef");
    expect(css).toContain("border-radius: 16px");
  });
});
