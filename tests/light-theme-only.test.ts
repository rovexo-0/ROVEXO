import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * Superseded by Theme Switch v1.0 (Owner COD SÂNGE — final UI before Production).
 * Retains: no Settings Appearance · no parallel SettingsThemeSync · light remains default.
 */
describe("Theme architecture — single Profile Theme Switch (v1.0)", () => {
  it("forbids parallel Settings appearance / sync systems", () => {
    expect(existsSync(path.join(process.cwd(), "components/providers/SettingsThemeSync.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "lib/settings/theme.ts"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "features/settings/components/AppearancePicker.tsx"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "styles/rovexo/dark-theme-v1.css"))).toBe(false);
  });

  it("owns theme via RovexoThemeProvider + rovexo-theme localStorage", () => {
    const layout = readSource("app/layout.tsx");
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    expect(layout).toContain("RovexoThemeProvider");
    expect(layout).not.toContain("THEME_INIT_SCRIPT");
    expect(layout).not.toContain("rovexo-theme-init");
    expect(provider).toContain("readStoredRovexoTheme");
    expect(existsSync(path.join(process.cwd(), "components/providers/RovexoThemeProvider.tsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "lib/theme/rovexo-theme-v1.ts"))).toBe(true);
    expect(existsSync(path.join(process.cwd(), "styles/rovexo/black-underground-theme-v1.css"))).toBe(
      true,
    );
  });

  it("removes Appearance from settings inventory", () => {
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(menu).not.toContain("appearance");
    expect(menu).not.toContain("Appearance");
  });

  it("keeps light tokens as default and Black Underground as dark", () => {
    const tokens = readSource("styles/tokens.css");
    const index = readSource("styles/rovexo/index.css");
    expect(tokens).toContain("--ds-color-background: #ffffff");
    expect(tokens).toContain("--ds-color-primary: #9333ea");
    expect(tokens).toMatch(/\[data-theme=["']dark["']\]/);
    expect(index).toContain("black-underground-theme-v1.css");
  });

  it("redirects legacy appearance route to settings", () => {
    const page = readSource("app/(platform)/account/preferences/appearance/page.tsx");
    expect(page).toContain('redirect("/account/settings")');
  });
});
