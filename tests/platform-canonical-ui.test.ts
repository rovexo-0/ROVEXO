import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("platform canonical UI v1.0", () => {
  it("ships the global canonical stylesheet", () => {
    const css = readSource("styles/rovexo/platform-canonical-ui.css");
    expect(css).toContain("--pcu-card-radius: 14px");
    expect(css).toContain(".pcu-module");
    expect(css).toContain(".ac-canonical__row-subtitle");
  });

  it("imports platform canonical UI in the design system entry", () => {
    expect(readSource("styles/rovexo/index.css")).toContain("platform-canonical-ui.css");
  });

  it("exposes canonical section primitives", () => {
    const index = readSource("components/ui/canonical/index.ts");
    expect(index).toContain("CanonicalSection");
    expect(index).toContain("CanonicalSettingsSection");
    expect(index).toContain("CanonicalModuleBody");
  });

  it("routes settings UI through canonical design system", () => {
    expect(readSource("features/settings/components/SettingSection.tsx")).toContain("CanonicalSection");
    expect(readSource("features/settings/components/SettingToggle.tsx")).toContain("CanonicalSwitch");
    expect(readSource("features/account-module/components/SettingsAccordion.tsx")).toContain("CanonicalMenuRow");
  });

  it("aligns help centre with My Account settings rows", () => {
    const help = readSource("features/help/components/HelpCentrePage.tsx");
    const section = readSource("features/help/components/HelpCentreCanonicalSection.tsx");
    expect(help).toContain("AccountCanonicalShell");
    expect(help).toContain("CanonicalSection");
    expect(help).toContain("CanonicalMenuRow");
    expect(section).toContain("CanonicalMenuRow");
    expect(section).not.toContain("mhub-section");
  });

  it("aligns notification settings with settings menu body", () => {
    const page = readSource("features/notifications/components/NotificationSettingsPage.tsx");
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("SettingSection");
  });

  it("supports canonical card variant", () => {
    expect(readSource("components/ui/Card.tsx")).toContain('variant?: "default" | "canonical"');
    expect(readSource("components/ui/Card.tsx")).toContain("rx-surface-card--canonical");
  });
});
