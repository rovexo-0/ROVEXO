import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSettingsHubVisibility } from "@/lib/master-engine/settings";
import {
  SETTINGS_ICON_TONES,
  SETTINGS_V1_STATUS,
  SETTINGS_V1_MASTER_RULE,
  SETTINGS_V1_INVENTORY,
  settingsV1Snapshot,
} from "@/lib/settings/settings-v1";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { SETTINGS_MENU_ROW_TITLES } from "@/lib/settings/freeze";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Settings v1.0 lock — hub + Master Engine", () => {
  it("locks permanent Status + Profile inheritance", () => {
    expect(SETTINGS_V1_STATUS).toContain("PERMANENT LOCK");
    expect(SETTINGS_V1_STATUS).toContain("UI/UX APPROVED");
    expect(SETTINGS_V1_STATUS).toContain("PRODUCTION READY");
    expect(SETTINGS_V1_MASTER_RULE.onlyContentMayDiffer).toBe(true);
    expect(SETTINGS_V1_MASTER_RULE.inherits100Percent).toContain("Icon Family");
    expect(SETTINGS_V1_INVENTORY.account[0].title).toBe("Personal Information");
    expect(settingsV1Snapshot().ux.findSectionUnderOneSecond).toBe(true);
  });

  it("matches Owner inventory titles and subtitles", () => {
    const sections = buildSettingsMenuSections(null);
    const rows = sections.flatMap((s) => s.rows);
    expect(rows.map((r) => r.title)).toEqual([...SETTINGS_MENU_ROW_TITLES]);
    expect(rows[0].subtitle).toBe("Name, photo and username.");
    expect(rows.some((r) => r.title === "Help Centre")).toBe(true);
    expect(rows.some((r) => r.title === "Legal Information")).toBe(true);
  });

  it("shows the hub in non-production preview modes", () => {
    expect(resolveSettingsHubVisibility().visible).toBe(true);
  });

  it("assigns canonical icon tones to every menu row", () => {
    const tones = new Set(SETTINGS_ICON_TONES);
    for (const section of buildSettingsMenuSections(null)) {
      for (const row of section.rows) {
        expect(tones.has(row.tone)).toBe(true);
      }
    }
  });

  it("wires fail-closed on the settings hub shell", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    expect(settings).toContain("resolveSettingsHubVisibility");
    expect(settings).toContain("FailClosedPanel");
    expect(settings).toContain("loadFailed");
    expect(settings).toContain("MyAccountTemplate");
  });
});
