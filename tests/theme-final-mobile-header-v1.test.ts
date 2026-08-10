import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ACCOUNT_MENU_TITLES } from "@/lib/account/freeze";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import type { UserProfile } from "@/lib/profile/types";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const profile = {
  id: "u1",
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: true,
    hasSellerProfile: true,
    hasBusinessAccount: false,
  }),
  accountKind: ROVEXO_ACCOUNT_KIND,
} as UserProfile;

describe("Final theme fix — mobile Profile + headers", () => {
  it("Profile menu includes Theme after Rovexo Ideas (same on all viewports)", () => {
    expect(ACCOUNT_MENU_TITLES).toContain("Theme");
    const titles = buildAccountMenuSections(profile, { activeListingCount: 1 }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    const ideas = titles.indexOf("Rovexo Ideas");
    const theme = titles.indexOf("Theme");
    expect(ideas).toBeGreaterThan(-1);
    expect(theme).toBe(ideas + 1);
  });

  it("AccountMenuSections always mounts Theme group (not viewport-gated)", () => {
    const sections = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(sections).toContain('data-profile-theme-group="v1.0"');
    expect(sections).toContain("<ThemeProfileRow");
    expect(sections).not.toContain("isMobile");
    expect(sections).not.toContain("useMediaQuery");
    expect(sections).not.toContain("@media");
  });

  it("useRovexoTheme never throws and uses document data-theme SSOT", () => {
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    expect(provider).toContain("useDocumentThemeController");
    expect(provider).toContain("useSyncExternalStore");
    expect(provider).not.toContain("must be used within RovexoThemeProvider");
    expect(provider).not.toContain("matchMedia");
    expect(provider).not.toContain("innerWidth");
  });

  it("headers use theme tokens — no hard white lock in standard header CSS", () => {
    const standard = readSource("styles/rovexo/rovexo-header-standard-v1.css");
    const h2 = readSource("styles/rovexo/header-v2.css");
    const dark = readSource("styles/rovexo/black-underground-theme-v1.css");

    expect(standard).toContain("var(--rvx-page");
    expect(h2).toContain("var(--rvx-page");
    expect(dark).toContain(".rx-h2");
    expect(dark).toContain(".rx-page-header__bar");
    expect(dark).toContain(".cds-header");
    expect(dark).toContain(".homepage-header");
    expect(dark).toContain(".account-canonical-header__bar");
    expect(dark).toContain('data-profile-theme-row="v1.0"');
  });

  it("P0 — no product image filters in theme/header changes", () => {
    const dark = readSource("styles/rovexo/black-underground-theme-v1.css").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    expect(dark).not.toMatch(/brightness\s*\(/i);
    expect(dark).not.toMatch(/filter\s*:\s*[^;]*blur\s*\(/i);
    const filterValues = [...dark.matchAll(/(?:^|[^a-zA-Z0-9_-])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;!}{]+)/g)].map(
      (m) => m[1].trim(),
    );
    for (const value of filterValues) {
      expect(value).toBe("none");
    }
    const blendValues = [...dark.matchAll(/(?:mix-blend-mode|background-blend-mode)\s*:\s*([^;!}{]+)/g)].map(
      (m) => m[1].trim(),
    );
    for (const value of blendValues) {
      expect(value).toBe("normal");
    }
  });
});
