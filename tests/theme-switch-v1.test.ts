import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BLACK_UNDERGROUND_PALETTE,
  normalizeRovexoTheme,
  ROVEXO_THEME_DEFAULT,
  ROVEXO_THEME_STORAGE_KEY,
  rovexoThemeSnapshot,
} from "@/lib/theme/rovexo-theme-v1";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Theme Switch v1.0", () => {
  it("defaults to light and normalizes storage values", () => {
    expect(ROVEXO_THEME_DEFAULT).toBe("light");
    expect(normalizeRovexoTheme("dark")).toBe("dark");
    expect(normalizeRovexoTheme("light")).toBe("light");
    expect(normalizeRovexoTheme(null)).toBe("light");
    expect(normalizeRovexoTheme("garbage")).toBe("light");
    expect(ROVEXO_THEME_STORAGE_KEY).toBe("rovexo-theme");
  });

  it("locks Black Underground palette tokens", () => {
    expect(BLACK_UNDERGROUND_PALETTE.page).toBe("#0D0F14");
    expect(BLACK_UNDERGROUND_PALETTE.surface).toBe("#171A21");
    expect(BLACK_UNDERGROUND_PALETTE.secondarySurface).toBe("#1E222B");
    expect(BLACK_UNDERGROUND_PALETTE.border).toBe("#2B2F38");
    expect(BLACK_UNDERGROUND_PALETTE.divider).toBe("#343A45");
    expect(BLACK_UNDERGROUND_PALETTE.primaryText).toBe("#FFFFFF");
    expect(BLACK_UNDERGROUND_PALETTE.secondaryText).toBe("#B6BCC8");
    expect(BLACK_UNDERGROUND_PALETTE.accent.toLowerCase()).toBe("#9333ea");
    expect(rovexoThemeSnapshot().productImageProtection.filters).toBe("FORBIDDEN");
  });

  it("places Theme switch directly under Rovexo Ideas on Profile (mobile + desktop)", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const sections = readSource("features/account-center/components/AccountMenuSections.tsx");
    const row = readSource("features/account-center/components/ThemeProfileRow.tsx");

    const ideasIdx = menu.indexOf('id: "ideas"');
    const themeIdx = menu.indexOf('id: "theme"');
    expect(ideasIdx).toBeGreaterThan(-1);
    expect(themeIdx).toBeGreaterThan(ideasIdx);
    expect(menu).toContain('title: "Theme"');
    expect(sections).toContain("ThemeProfileRow");
    expect(sections).toContain('data-profile-theme-group="v1.0"');
    expect(sections).toContain('data-section="theme"');
    expect(row).toContain('data-theme-switch="v1.0"');
    expect(row).toContain('data-profile-theme-row="v1.0"');
    expect(row).toContain("CanonicalSwitch");
    expect(row).toContain('setTheme(next ? "dark" : "light")');
    expect(row).not.toContain("router.refresh");
    expect(row).not.toContain("window.location");
    expect(row).not.toContain("fetch(");
    // No viewport-specific theme branching
    expect(row).not.toContain("@media");
    expect(row).not.toContain("useMediaQuery");
  });

  it("wires single RovexoThemeProvider + localStorage persistence (no DB)", () => {
    const layout = readSource("app/layout.tsx");
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    const ssot = readSource("lib/theme/rovexo-theme-v1.ts");

    expect(layout).toContain("RovexoThemeProvider");
    expect(layout).not.toContain("THEME_INIT_SCRIPT");
    expect(layout).not.toContain("rovexo-theme-init");
    expect(provider).toContain("readStoredRovexoTheme");
    expect(provider).toContain("persistRovexoTheme");
    expect(provider).toContain("useSyncExternalStore");
    expect(ssot).toContain('ROVEXO_THEME_STORAGE_KEY = "rovexo-theme"');
    expect(ssot).toContain("localStorage");
    expect(ssot).not.toContain("supabase");
    expect(ssot).not.toContain("fetch(");
    expect(existsSync(path.join(process.cwd(), "components/providers/SettingsThemeSync.tsx"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "features/settings/components/AppearancePicker.tsx"))).toBe(
      false,
    );
  });

  it("keeps Appearance out of Settings (switch is Profile-only)", () => {
    const settingsMenu = readSource("lib/account-center/settings-menu.ts");
    expect(settingsMenu).not.toContain("appearance");
    expect(settingsMenu).not.toContain("Appearance");
  });

  it("imports Black Underground CSS last and keeps light tokens", () => {
    const index = readSource("styles/rovexo/index.css");
    const tokens = readSource("styles/tokens.css");
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");

    expect(index).toContain("black-underground-theme-v1.css");
    expect(index.lastIndexOf("black-underground-theme-v1.css")).toBeGreaterThan(
      index.lastIndexOf("phone-width-v1-freeze.css"),
    );
    expect(tokens).toContain("--rvx-page:");
    expect(tokens).toContain("--ds-color-background: #ffffff");
    expect(tokens).toContain("--ds-color-primary: #9333ea");
    expect(tokens).toMatch(/\[data-theme=["']dark["']\]/);
    expect(darkCss).toContain("--rvx-page");
    expect(darkCss).toContain("#0d0f14");
    expect(darkCss).toContain("#171a21");
    expect(darkCss).toContain("#b6bcc8");
  });

  it("P0 — no product-image filters or blend modes in theme CSS", () => {
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");
    // Strip block comments so safety prose does not false-positive on forbidden tokens.
    const codeOnly = darkCss.replace(/\/\*[\s\S]*?\*\//g, "");
    const forbidden = [
      /brightness\s*\(/i,
      /contrast\s*\(/i,
      /saturate\s*\(/i,
      /hue-rotate\s*\(/i,
      /grayscale\s*\(/i,
      /sepia\s*\(/i,
      /invert\s*\(/i,
      /filter\s*:\s*[^;]*blur\s*\(/i,
    ];
    for (const pattern of forbidden) {
      expect(codeOnly).not.toMatch(pattern);
    }
    // Protective filter:none / blend normal are allowed; altering values are not.
    const filterValues = [...codeOnly.matchAll(/(?:^|[^a-zA-Z0-9_-])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;!}{]+)/g)].map(
      (m) => m[1].trim(),
    );
    for (const value of filterValues) {
      expect(value).toBe("none");
    }
    const blendValues = [...codeOnly.matchAll(/(?:mix-blend-mode|background-blend-mode)\s*:\s*([^;!}{]+)/g)].map(
      (m) => m[1].trim(),
    );
    for (const value of blendValues) {
      expect(value).toBe("normal");
    }
    expect(codeOnly).not.toMatch(/html\[data-theme=["']dark["']\]\s+img\s*\{/);
  });

  it("does not modify ListingCard / SafeImage / message / notification engines", () => {
    // Structural freeze: Theme Switch must not rewrite these files.
    const listingCard = readSource("components/ui/ListingCard.tsx");
    const safeImage = readSource("components/ui/SafeImage.tsx");
    expect(listingCard).toContain("ListingCard");
    expect(safeImage).toContain("SafeImage");
    expect(listingCard).not.toContain("data-theme");
    expect(safeImage).not.toContain("filter:");
  });
});
