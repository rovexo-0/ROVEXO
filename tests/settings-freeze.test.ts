import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SETTINGS_APPROVED_INVENTORY,
  SETTINGS_CANONICAL_COMPONENTS,
  SETTINGS_CANONICAL_FROZEN,
  SETTINGS_CANONICAL_STATUS,
  SETTINGS_DANGER_ACTIONS,
  SETTINGS_FREEZE_DOM,
  SETTINGS_MENU_ROW_TITLES,
  SETTINGS_ROUTES,
  SETTINGS_SECTION_TITLES,
  SETTINGS_SPEC_VERSION,
  SETTINGS_STATUS,
  SETTINGS_UI_FREEZE,
} from "@/lib/settings/freeze";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Settings v1.0 — PERMANENT LOCK (Master Engine)", () => {
  it("locks freeze constants", () => {
    expect(SETTINGS_STATUS).toBe("PERMANENT_LOCK_v1.0_APPROVED");
    expect(SETTINGS_UI_FREEZE).toBe("PERMANENT_LOCK_v1.0_APPROVED");
    expect(SETTINGS_CANONICAL_STATUS).toBe("PERMANENT_LOCK_v1.0_APPROVED");
    expect(SETTINGS_CANONICAL_FROZEN).toBe(true);
    expect(SETTINGS_SPEC_VERSION).toBe("1.0");
    expect(SETTINGS_ROUTES.hub).toBe("/account/settings");
    expect(SETTINGS_FREEZE_DOM.canonical).toBe("v1.0");
    expect(SETTINGS_CANONICAL_COMPONENTS).toEqual([
      "SettingsV1",
      "SettingsMenuSections",
      "DeleteAccountFlow",
      "SettingsMenuIconGlyph",
      "AccountCanonicalShell",
      "MyAccountTemplate",
    ]);
  });

  it("locks approved hub shell without Sign Out in Settings", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("MyAccountTemplate");
    expect(settings).toContain("showHeaderTitle");
    expect(settings).toContain('title="Settings"');
    expect(settings).toContain("SettingsMenuSections");
    expect(sections).toContain('data-settings-canonical="v1.0"');
    expect(sections).toContain("buildSettingsMenuSections");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).not.toContain('title="Sign Out"');
    expect(sections).toContain('title="DANGER ZONE"');
    expect(sections).toContain("fw-engine__group");
    expect(sections).not.toContain("CanonicalCard");
  });

  it("locks frozen section and row inventory", () => {
    const sections = buildSettingsMenuSections(null);
    const titles = sections.map((section) => section.title);
    const rowTitles = sections.flatMap((section) => section.rows.map((row) => row.title));

    expect(titles).toEqual([...SETTINGS_SECTION_TITLES]);
    expect(rowTitles).toEqual([...SETTINGS_MENU_ROW_TITLES]);
    expect(SETTINGS_DANGER_ACTIONS).toEqual(["Delete Account"]);
    expect(SETTINGS_APPROVED_INVENTORY).toEqual([
      ...SETTINGS_MENU_ROW_TITLES,
      ...SETTINGS_DANGER_ACTIONS,
    ]);
  });

  it("documents freeze SSOT artifacts only", () => {
    const freezeTs = readSource("lib/settings/freeze.ts");
    const freezeDoc = readSource("docs/modules/settings/SETTINGS_FREEZE.md");
    const spec = readSource("docs/modules/settings/SETTINGS_SPECIFICATION.md");

    expect(freezeTs).toContain('SETTINGS_STATUS = "PERMANENT_LOCK_v1.0_APPROVED"');
    expect(freezeDoc).toContain("PERMANENT LOCK");
    expect(freezeDoc).toContain("2026-07-20");
    expect(freezeDoc).toContain("Personal Information");
    expect(spec).toContain("PERMANENT_LOCK_v1.0_APPROVED");
    expect(spec).toContain("STATUS:");
    expect(existsSync(path.join(process.cwd(), "tests/settings-freeze.test.ts"))).toBe(true);
  });
});
