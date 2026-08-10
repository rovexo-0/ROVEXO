import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BLACK_UNDERGROUND_PALETTE,
  ROVEXO_THEME_CSS_VARS,
  ROVEXO_THEME_STORAGE_KEY,
} from "@/lib/theme/rovexo-theme-v1";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Black Underground — global theme propagation", () => {
  it("exposes canonical --rvx-* CSS variables", () => {
    const tokens = readSource("styles/tokens.css");
    expect(ROVEXO_THEME_CSS_VARS.page).toBe("--rvx-page");
    expect(tokens).toContain("--rvx-page:");
    expect(tokens).toContain("--rvx-surface:");
    expect(tokens).toContain("--rvx-surface-secondary:");
    expect(tokens).toContain("--rvx-border:");
    expect(tokens).toContain("--rvx-divider:");
    expect(tokens).toContain("--rvx-text-primary:");
    expect(tokens).toContain("--rvx-text-secondary:");
    expect(tokens).toContain("--rvx-accent:");
  });

  it("applies theme at html root — not Profile-only", () => {
    const layout = readSource("app/layout.tsx");
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");

    expect(layout).toContain('data-theme="light"');
    expect(provider).toContain("document.documentElement");
    expect(provider).toContain("data-theme");
    expect(darkCss).toContain('html[data-theme="dark"]');
    expect(darkCss).toContain("--rvx-page");
    // Single provider only
    expect(existsSync(path.join(process.cwd(), "components/providers/RovexoThemeProvider.tsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "components/providers/ThemeProvider.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "components/providers/DarkThemeProvider.tsx"))).toBe(
      false,
    );
  });

  it("propagates dark to Profile / Settings shells and menus", () => {
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");
    const account = readSource("styles/rovexo/account-canonical-v2.css");
    const settings = readSource("styles/rovexo/account-settings-ui.css");
    const platform = readSource("styles/rovexo/platform-canonical-ui.css");

    expect(account).toContain("var(--rvx-page");
    expect(settings).toContain("var(--rvx-surface");
    expect(platform).toContain("var(--rvx-page");
    expect(platform).toContain("var(--rvx-surface");
    expect(darkCss).toContain(".cds-menu-row");
    expect(darkCss).toContain(".ac-canonical");
    expect(darkCss).toContain(".cds-layout__content--account-canonical");
  });

  it("propagates dark to Inbox, Conversation, Wallet, Orders, Product, Checkout", () => {
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");
    expect(darkCss).toContain(".inbox-hub");
    expect(darkCss).toContain(".conv-hub");
    expect(darkCss).toContain(".wallet-v2");
    expect(darkCss).toContain(".orders-page");
    expect(darkCss).toContain(".pd-v1");
    expect(darkCss).toContain(".ckt-v1");
    expect(darkCss).toContain("[role=\"dialog\"]");
    expect(darkCss).toContain("[data-drawer]");
    expect(darkCss).toContain("[data-sheet]");
  });

  it("module surfaces inherit via CSS variables (not a second theme system)", () => {
    const conv = readSource("styles/rovexo/conversation-hub-v1.css");
    const inbox = readSource("styles/rovexo/inbox-hub-v1.css");
    const wallet = readSource("styles/rovexo/wallet-hub-v1.css");
    const fw = readSource("styles/rovexo/full-width-engine-v1.css");

    expect(conv).toContain("var(--conv-surface)");
    expect(inbox).toContain("var(--inbox-surface)");
    expect(wallet).toContain("var(--rvx-page");
    expect(wallet).toContain("var(--rvx-surface");
    expect(fw).toContain("var(--rvx-page");
  });

  it("persists via existing rovexo-theme key and survives navigation conceptually", () => {
    const ssot = readSource("lib/theme/rovexo-theme-v1.ts");
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    expect(ROVEXO_THEME_STORAGE_KEY).toBe("rovexo-theme");
    expect(ssot).toContain("persistRovexoTheme");
    expect(provider).toContain("applyRovexoThemeToDocument");
    // Root attribute = global; no route-scoped theme state
    expect(provider).not.toContain("usePathname");
    expect(provider).not.toContain("profileTheme");
    expect(provider).not.toContain("homeTheme");
  });

  it("locks Black Underground palette and light default unchanged", () => {
    const tokens = readSource("styles/tokens.css");
    expect(BLACK_UNDERGROUND_PALETTE.page.toLowerCase()).toBe("#0d0f14");
    expect(tokens).toContain("--rvx-page: #ffffff");
    expect(tokens).toContain("--ds-color-background: #ffffff");
  });

  it("P0 — theme CSS has no product-image filters; ListingCard/SafeImage untouched", () => {
    const darkCss = readSource("styles/rovexo/black-underground-theme-v1.css");
    const codeOnly = darkCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(codeOnly).not.toMatch(/brightness\s*\(/i);
    expect(codeOnly).not.toMatch(/filter\s*:\s*[^;]*blur\s*\(/i);
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

    const listingCard = readSource("components/ui/ListingCard.tsx");
    const safeImage = readSource("components/ui/SafeImage.tsx");
    expect(listingCard).not.toContain("data-theme");
    expect(safeImage).not.toContain("filter:");
  });
});
