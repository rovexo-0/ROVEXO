import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_SWITCH_SPEC,
  getSwitchEngineSnapshot,
  resolveCanonicalSwitchChecked,
  resolveCanonicalSwitchDisabled,
  SWITCH_ENGINE_STATUS,
  SWITCH_ENGINE_UI_LOCK,
  SWITCH_ENGINE_VERSION,
} from "@/lib/master-engine/switch-engine";
import { NOTIFICATION_USER_CONTROLS } from "@/lib/notifications/controls";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function walkTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "archive") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkTsxFiles(full, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("Canonical Switch Engine v1.0 (LOCKED)", () => {
  it("locks engine snapshot and Owner dimensions", () => {
    const snap = getSwitchEngineSnapshot();
    expect(SWITCH_ENGINE_STATUS).toBe("LOCKED");
    expect(SWITCH_ENGINE_VERSION).toBe("v1.0");
    expect(SWITCH_ENGINE_UI_LOCK).toBe(true);
    expect(snap.component).toBe("CanonicalSwitch");
    expect(snap.spec.visual).toEqual({ widthPx: 28, heightPx: 16 });
    expect(snap.spec.on.track).toBe("#047857");
    expect(snap.spec.off.track).toBe("#E5E7EB");
    expect(CANONICAL_SWITCH_SPEC.hitTarget).toEqual({ widthPx: 44, heightPx: 44 });
  });

  it("fail-closes unknown state to OFF and disables only on explicit true", () => {
    expect(resolveCanonicalSwitchChecked(true)).toBe(true);
    expect(resolveCanonicalSwitchChecked(false)).toBe(false);
    expect(resolveCanonicalSwitchChecked(null)).toBe(false);
    expect(resolveCanonicalSwitchChecked(undefined)).toBe(false);
    expect(resolveCanonicalSwitchChecked("true")).toBe(false);
    expect(resolveCanonicalSwitchDisabled(true)).toBe(true);
    expect(resolveCanonicalSwitchDisabled(false)).toBe(false);
    expect(resolveCanonicalSwitchDisabled(undefined)).toBe(false);
  });

  it("locks notification page control inventory", () => {
    expect(NOTIFICATION_USER_CONTROLS.map((c) => c.id)).toEqual([
      "orders",
      "inbox",
      "wallet",
      "payments",
      "promotions",
      "reviews",
      "push",
      "email",
    ]);
  });

  it("ships locked CSS tokens — green ON, never purple primary", () => {
    const css = readSource("styles/rovexo/canonical-ds.css");
    expect(css).toContain("--cds-switch-width: 28px");
    expect(css).toContain("--cds-switch-height: 16px");
    expect(css).toContain("--cds-switch-track-on: #047857");
    expect(css).toContain("--cds-switch-duration: 200ms");
    expect(css).toContain("--cds-switch-disabled-opacity: 0.4");
  });

  it("wires CanonicalSwitch through engine resolvers", () => {
    const component = readSource("src/components/canonical/CanonicalSwitch.tsx");
    expect(component).toContain("resolveCanonicalSwitchChecked");
    expect(component).toContain("resolveCanonicalSwitchDisabled");
    expect(component).toContain('data-switch-engine="v1.0"');
  });

  it("routes SettingToggle and Holiday Mode through CanonicalSwitch", () => {
    expect(readSource("features/settings/components/SettingToggle.tsx")).toContain("CanonicalSwitch");
    expect(readSource("features/account-center/components/HolidayModeProfileRow.tsx")).toContain(
      "CanonicalSwitch",
    );
    expect(readSource("features/account/components/AccountSecurityPage.tsx")).toContain(
      'href="/account/security/two-factor"',
    );
  });

  it("forbids role=switch outside CanonicalSwitch SSOT", () => {
    const roots = ["features", "components", "app", "src"].map((r) => join(process.cwd(), r));
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of walkTsxFiles(root)) {
        if (file.endsWith(`${join("canonical", "CanonicalSwitch.tsx")}`)) continue;
        const source = readFileSync(file, "utf8");
        if (/role=["']switch["']/.test(source)) {
          offenders.push(file.replace(process.cwd() + "/", ""));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
