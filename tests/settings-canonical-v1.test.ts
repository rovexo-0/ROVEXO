import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { SETTINGS_MENU_ROW_TITLES, SETTINGS_SECTION_TITLES } from "@/lib/settings/freeze";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Settings canonical v1.0 hub — Master Engine lock", () => {
  it("uses flat sections with canonical menu rows (no accordion)", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("MyAccountTemplate");
    expect(settings).toContain("showHeaderTitle");
    expect(settings).toContain("SettingsMenuSections");
    expect(settings).not.toContain("SettingsAccordion");
    expect(sections).toContain('data-settings-canonical="v1.0"');
    expect(sections).toContain('data-settings-lock="permanent"');
    expect(sections).toContain("CanonicalMenuRow");
    expect(sections).toContain("fw-engine__group");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).toContain("dangerRow");
    expect(sections).not.toContain("CanonicalCard");
    expect(sections).not.toContain("Sign Out");
  });

  it("defines Master Engine Settings inventory", () => {
    const sections = buildSettingsMenuSections(null);
    expect(sections.map((section) => section.title)).toEqual([...SETTINGS_SECTION_TITLES]);
    expect(sections.flatMap((section) => section.rows.map((row) => row.title))).toEqual([
      ...SETTINGS_MENU_ROW_TITLES,
    ]);

    const hrefs = sections.flatMap((section) => section.rows.map((row) => row.href));
    expect(hrefs).toContain("/account/profile");
    expect(hrefs).toContain("/account/addresses");
    expect(hrefs).toContain("/notifications/settings");
    expect(hrefs).toContain("/account/privacy");
    expect(hrefs).toContain("/account/security");
    expect(hrefs).toContain("/account/verification");
    expect(hrefs).not.toContain("/account/profile#language");
    expect(hrefs).not.toContain("/account/preferences/language");
    expect(hrefs).toContain("/account/preferences/currency");
    expect(hrefs).not.toContain("/account/profile#currency");
    expect(hrefs).not.toContain("/trust");
    expect(hrefs).not.toContain("/wallet/payment-methods");
    expect(hrefs).not.toContain("/account/promotion-tools");
    expect(hrefs).not.toContain("/wallet");
    expect(hrefs).not.toContain("/help");
    expect(hrefs).not.toContain("/legal");
  });

  it("uses AccountIcon — One Product icon system", () => {
    const icon = readSource("features/account-module/components/SettingsMenuIcon.tsx");
    expect(icon).toContain("SettingsMenuIconGlyph");
  });
});
