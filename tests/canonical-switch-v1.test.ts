import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_SWITCH_CANONICAL,
  CANONICAL_SWITCH_COMPONENT,
  CANONICAL_SWITCH_DOM,
  CANONICAL_SWITCH_PRODUCTION_READY,
  CANONICAL_SWITCH_SPEC,
  CANONICAL_SWITCH_STATUS,
  CANONICAL_SWITCH_VERSION,
} from "@/lib/design-system/canonical-switch-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Canonical Switch v1.0 (LOCKED)", () => {
  it("locks freeze markers and Owner dimensions", () => {
    expect(CANONICAL_SWITCH_STATUS).toBe("LOCKED");
    expect(CANONICAL_SWITCH_VERSION).toBe("1.0");
    expect(CANONICAL_SWITCH_CANONICAL).toBe(true);
    expect(CANONICAL_SWITCH_PRODUCTION_READY).toBe(true);
    expect(CANONICAL_SWITCH_COMPONENT).toBe("CanonicalSwitch");
    expect(CANONICAL_SWITCH_DOM).toBe("v1.0");
    expect(CANONICAL_SWITCH_SPEC.visual).toEqual({ widthPx: 28, heightPx: 16 });
    expect(CANONICAL_SWITCH_SPEC.thumb).toEqual({
      widthPx: 14,
      heightPx: 14,
      borderRadius: "50%",
    });
    expect(CANONICAL_SWITCH_SPEC.hitTarget).toEqual({ widthPx: 44, heightPx: 44 });
    expect(CANONICAL_SWITCH_SPEC.on.track).toBe("#047857");
    expect(CANONICAL_SWITCH_SPEC.off.track).toBe("#E5E7EB");
    expect(CANONICAL_SWITCH_SPEC.failClosedDefault).toBe(false);
  });

  it("ships locked CSS tokens and no purple ON track", () => {
    const css = readSource("styles/rovexo/canonical-ds.css");
    expect(css).toContain("--cds-switch-width: 28px");
    expect(css).toContain("--cds-switch-height: 16px");
    expect(css).toContain("--cds-switch-thumb-size: 14px");
    expect(css).toContain("--cds-switch-hit: 44px");
    expect(css).toContain("--cds-switch-track-off: #e5e7eb");
    expect(css).toContain("--cds-switch-track-on: #047857");
    expect(css).toContain("--cds-switch-duration: 200ms");
    expect(css).toContain("--cds-switch-disabled-opacity: 0.4");
    expect(css).toContain(".cds-switch__thumb");
    expect(css).not.toMatch(/\.cds-switch__input:checked \+ \.cds-switch__track \{\s*background: var\(--cds-color-primary\)/);
  });

  it("fail-closes unavailable state to OFF and marks DOM lock", () => {
    const component = readSource("src/components/canonical/CanonicalSwitch.tsx");
    expect(component).toContain("resolveCanonicalSwitchChecked");
    expect(component).toContain('data-canonical-switch="v1.0"');
    expect(component).toContain('data-switch-engine="v1.0"');
    expect(component).toContain('data-switch-state={isOn ? "on" : "off"}');
    expect(component).toContain("controlOnly");
  });

  it("routes SettingToggle and Holiday Mode through CanonicalSwitch only", () => {
    expect(readSource("features/settings/components/SettingToggle.tsx")).toContain("CanonicalSwitch");
    expect(readSource("features/account-center/components/HolidayModeProfileRow.tsx")).toContain(
      "CanonicalSwitch",
    );
    expect(readSource("features/account-center/components/HolidayModeProfileRow.tsx")).not.toContain(
      "ac-holiday-mode-switch__",
    );
    expect(readSource("styles/rovexo/account-canonical-v2.css")).not.toContain(
      ".ac-holiday-mode-switch {",
    );
  });
});
