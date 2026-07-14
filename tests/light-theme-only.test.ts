import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Canonical light theme only — dark theme removed", () => {
  it("removes theme engine, picker, and dark overlay", () => {
    expect(existsSync(path.join(process.cwd(), "components/providers/ThemeProvider.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "components/providers/SettingsThemeSync.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "lib/settings/theme.ts"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "features/settings/components/AppearancePicker.tsx"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "styles/rovexo/dark-theme-v1.css"))).toBe(false);
  });

  it("locks html to light and wires no theme provider", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).toContain('data-theme="light"');
    expect(layout).not.toContain("ThemeProvider");
    expect(layout).not.toContain("SettingsThemeSync");
    expect(layout).not.toContain("THEME_INIT_SCRIPT");
    expect(layout).not.toContain("rovexo-theme");
  });

  it("removes Appearance from settings inventory", () => {
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(menu).not.toContain("appearance");
    expect(menu).not.toContain("Appearance");
  });

  it("keeps light tokens and no dark theme selectors in design tokens", () => {
    const tokens = readSource("styles/tokens.css");
    const globals = readSource("app/globals.css");
    const index = readSource("styles/rovexo/index.css");
    expect(tokens).toContain("--ds-color-background: #ffffff");
    expect(tokens).toContain("--ds-color-primary: #9333ea");
    expect(tokens).not.toMatch(/\[data-theme=["']dark["']\]/);
    expect(globals).not.toContain("@custom-variant dark");
    expect(index).not.toContain("dark-theme-v1.css");
  });

  it("redirects legacy appearance route to settings", () => {
    const page = readSource("app/account/preferences/appearance/page.tsx");
    expect(page).toContain('redirect("/account/settings")');
  });
});
