import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { applyTheme, resolveTheme, THEME_STORAGE_KEY } from "@/lib/settings/theme";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Dark Theme v1.0 — complete appearance", () => {
  it("exposes Light / Dark / System in AppearancePicker", () => {
    const picker = readSource("features/settings/components/AppearancePicker.tsx");
    expect(picker).toContain('value: "light"');
    expect(picker).toContain('label: "Light"');
    expect(picker).toContain('value: "dark"');
    expect(picker).toContain('label: "Dark"');
    expect(picker).toContain('value: "system"');
    expect(picker).toContain('label: "System"');
    expect(picker).not.toContain('label: "White"');
    expect(picker).not.toContain('label: "Black"');
  });

  it("locks Dark Theme v1.0 palette tokens", () => {
    const tokens = readSource("styles/tokens.css");
    expect(tokens).toContain("--ds-color-background: #0f172a");
    expect(tokens).toContain("--ds-color-secondary: #111827");
    expect(tokens).toContain("--ds-color-surface: #1f2937");
    expect(tokens).toContain("--ds-color-surface-elevated: #273449");
    expect(tokens).toContain("--ds-color-text-primary: #ffffff");
    expect(tokens).toContain("--ds-color-text-secondary: #9ca3af");
    expect(tokens).toContain("rgb(255 255 255 / 0.08)");
    expect(tokens).toContain("--ds-color-success: #22c55e");
    expect(tokens).toContain("--ds-color-warning: #f59e0b");
    expect(tokens).toContain("--ds-color-danger: #ef4444");
    expect(tokens).toContain("--ds-color-primary: #9333ea");
    expect(tokens).toContain("--ds-duration-theme: 200ms");
  });

  it("ships complete dark-theme overlay and wires it last", () => {
    const dark = readSource("styles/rovexo/dark-theme-v1.css");
    const index = readSource("styles/rovexo/index.css");
    expect(index).toContain('@import "./dark-theme-v1.css"');
    expect(dark).toContain("ROVEXO Dark Theme v1.0");
    expect(dark).toContain("[data-theme=\"dark\"] .ac-canonical");
    expect(dark).toContain("[data-theme=\"dark\"] .wallet-v2");
    expect(dark).toContain("[data-theme=\"dark\"] .ckt-v1");
    expect(dark).toContain("[data-theme=\"dark\"] .orders-v1");
    expect(dark).toContain("[data-theme=\"dark\"] .inbox-hub");
    expect(dark).toContain("[data-theme=\"dark\"] .auth-splash");
    expect(dark).toContain("[data-theme=\"dark\"] .listing-card");
    expect(dark).toContain("200ms");
  });

  it("darkens bottom nav / CDS / removes light-only locks", () => {
    const nav = readSource("styles/rovexo/bottom-nav-premium.css");
    const cds = readSource("styles/rovexo/canonical-ds.css");
    const wallet = readSource("styles/rovexo/wallet-hub-v1.css");
    const checkout = readSource("styles/rovexo/checkout-v1.css");

    expect(nav).toContain("background: #0f172a");
    expect(cds).toContain('[data-theme="dark"]');
    expect(cds).toContain("--cds-color-background: #0f172a");
    expect(wallet).not.toContain("color-scheme: only light");
    expect(checkout).not.toContain("color-scheme: only light");
  });

  it("keeps Theme Engine light/dark/system resolve + storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("rovexo-theme");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(["light", "dark"]).toContain(resolveTheme("system"));
    expect(typeof applyTheme).toBe("function");

    const provider = readSource("components/providers/ThemeProvider.tsx");
    const layout = readSource("app/layout.tsx");
    expect(provider).toContain('"system"');
    expect(layout).toContain("SettingsThemeSync");
    expect(layout).toContain("THEME_INIT_SCRIPT");
  });

  it("does not redesign frozen account markers", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    expect(home).toContain('data-account-freeze="FROZEN"');
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountStatsStrip");
  });
});
