import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Settings Sprint 1 — canonical foundation v1.0", () => {
  it("uses titled shell without intro or accordion", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("AccountCanonicalShell");
    expect(settings).toContain("showHeaderTitle");
    expect(settings).toContain('title="Settings"');
    expect(settings).not.toContain("intro=");
    expect(settings).toContain("SettingsMenuSections");
    expect(settings).not.toContain("SettingsAccordion");
    expect(sections).toContain('data-settings-canonical="v1.0"');
    expect(sections).toContain('data-settings-sprint="1-foundation"');
    expect(sections).toContain("CanonicalMenuRow");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).toContain("SettingsNotificationToggles");
    expect(sections).toContain("ROVEXO_APP_VERSION");
    expect(sections).toContain("ROVEXO_BUILD_NUMBER");
  });

  it("defines Sprint 1 section inventory and routes", () => {
    const sections = buildSettingsMenuSections(null);
    const titles = sections.map((section) => section.title);

    expect(titles).toEqual([
      "ACCOUNT",
      "PRIVACY",
      "NOTIFICATIONS",
      "PAYMENTS",
      "LEGAL",
      "SUPPORT",
    ]);

    const rowTitles = sections.flatMap((section) => section.rows.map((row) => row.title));
    expect(rowTitles).toEqual([
      "Email",
      "Phone Number",
      "Username",
      "Change Password",
      "Two-Factor Authentication",
      "Profile Visibility",
      "Blocked Users",
      "Download My Data",
      "Delete Account",
      "Push Notifications",
      "Email Notifications",
      "Order Updates",
      "Marketing Emails",
      "Payment Methods",
      "Connected Bank Account",
      "Platform Fees",
      "Terms & Conditions",
      "Privacy Policy",
      "Cookie Policy",
      "Marketplace Rules",
      "Help Centre",
      "Contact Support",
      "Report a Problem",
    ]);

    const hrefs = sections.flatMap((section) => section.rows.map((row) => row.href)).filter(Boolean);
    expect(hrefs).toContain("/account/profile");
    expect(hrefs).toContain("/account/security");
    expect(hrefs).toContain("/account/privacy");
    expect(hrefs).toContain("/account/blocked-users");
    expect(hrefs).toContain("/support?category=data-export");
    expect(hrefs).toContain("/wallet/payment-methods");
    expect(hrefs).toContain("/wallet/bank-account");
    expect(hrefs).toContain("/legal/platform-fee-policy");
    expect(hrefs).toContain("/legal/terms-and-conditions");
    expect(hrefs).toContain("/legal/privacy-policy");
    expect(hrefs).toContain("/legal/cookie-policy");
    expect(hrefs).toContain("/legal/community-guidelines");
    expect(hrefs).toContain("/help");
    expect(hrefs).toContain("/support");
    expect(hrefs).toContain("/support?category=report");
    expect(hrefs).not.toContain("/account/preferences/appearance");
    expect(hrefs).not.toContain("/account/preferences/language");
  });

  it("removes Appearance, Language, and experimental settings", () => {
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(menu).not.toContain("Appearance");
    expect(menu).not.toContain("Theme");
    expect(menu).not.toContain("Dark Mode");
    expect(menu).not.toContain("Language");
    expect(menu).not.toContain("Developer");
    expect(menu).not.toContain("Experimental");
  });

  it("uses Lucide outline icons in settings rows", () => {
    const icon = readSource("features/account-module/components/SettingsMenuIcon.tsx");
    expect(icon).toContain('from "lucide-react"');
    expect(icon).toContain("strokeWidth: 1.75");
    expect(icon).not.toContain("AccountIcon");
    expect(icon).not.toContain("createFluencyFeatureIcon");
  });

  it("locks Sprint 1 layout tokens", () => {
    const css = readSource("styles/rovexo/account-settings-canonical.css");
    expect(css).toContain("--cds-row-min-height: 56px");
    expect(css).toContain("--cds-row-padding-x: 20px");
    expect(css).toContain("--cds-space-section-gap: 16px");
    expect(css).toContain("border-radius: 20px");
    expect(css).toContain("max-width: 430px");
    expect(css).toContain("min-height: 64px");
  });
});
