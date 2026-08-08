/**
 * OPT-P0-CSS-02 — Homepage global CSS isolation (import moves only).
 * Verifies non-Homepage sheets left the platform megabundle; owners retained CSS;
 * Auth untouched; CSS assets not deleted; protected files unchanged.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sha256File(relativePath: string): string {
  return createHash("sha256").update(readFileSync(join(process.cwd(), relativePath))).digest("hex");
}

/** Confirmed non-Homepage sheets removed from styles/rovexo/index.css under OPT-P0-CSS-02. */
const REMOVED_FROM_HOMEPAGE_INDEX = [
  "account-module-v1.css",
  "account-2026.css",
  "account-center.css",
  "account.css",
  "account-hub-v1.css",
  "account-settings-v1.css",
  "account-settings-canonical.css",
  "rovexo-ideas-v1.css",
  "hero.css",
  "promotion-cards-v1.css",
  "sign-out.css",
  "my-account-primary-button-v1.css",
  "secondary-banners.css",
  "bring-your-item.css",
  "benefits-rail.css",
  "platform-visual.css",
  "premium-empty-state.css",
  "rvx-topbar-v1.css",
] as const;

/** Must remain on the Homepage / global platform critical path. */
const REQUIRED_IN_HOMEPAGE_INDEX = [
  "tokens.css",
  "typography.css",
  "shell.css",
  "layout.css",
  "mobile-scroll-v1.css",
  "bottom-nav-premium.css",
  "full-width-engine-v1.css",
  "phone-width-v1-freeze.css",
  "home-polish.css",
  "store-listing-card-premium-v1.css",
  "category-rail.css",
  "primary-button-v1.css",
  "platform-canonical-ui.css",
  "canonical-ds.css",
] as const;

/** CSS sheet files must still exist (not deleted). */
const RETAINED_CSS_ASSETS = [
  ...REMOVED_FROM_HOMEPAGE_INDEX,
  "store-listing-card-premium-v1.css",
  "auth-v1.css",
] as const;

/** Protected surfaces — OPT-P0-CSS-02 must not touch these files. */
const PROTECTED_FILES = [
  "next.config.ts",
  "components/ui/ListingCard.tsx",
  "components/ui/SafeImage.tsx",
  "app/(platform)/page.tsx",
  "lib/brand/official-brand-application-v1.ts",
] as const;

describe("OPT-P0-CSS-02 Homepage global CSS isolation", () => {
  it("A: Homepage platform entry no longer imports confirmed non-Homepage sheets", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of REMOVED_FROM_HOMEPAGE_INDEX) {
      expect(index, `${sheet} must leave index.css`).not.toContain(`@import "./${sheet}"`);
    }
  });

  it("B: required Homepage / platform CSS imports remain", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of REQUIRED_IN_HOMEPAGE_INDEX) {
      expect(index, `${sheet} must remain in index.css`).toContain(sheet);
    }
  });

  it("C+F: CSS sheet files themselves still exist (not deleted)", () => {
    for (const sheet of RETAINED_CSS_ASSETS) {
      expect(existsSync(join(process.cwd(), `styles/rovexo/${sheet}`)), sheet).toBe(true);
    }
  });

  it("D: protected files are not modified by this task scope check (paths still exist)", () => {
    for (const file of PROTECTED_FILES) {
      expect(existsSync(join(process.cwd(), file)), file).toBe(true);
    }
    /* Content integrity: ListingCard / SafeImage / homepage / next.config must not gain CSS isolation edits. */
    expect(readSource("components/ui/ListingCard.tsx")).not.toContain("OPT-P0-CSS-02");
    expect(readSource("components/ui/SafeImage.tsx")).not.toContain("OPT-P0-CSS-02");
    expect(readSource("app/(platform)/page.tsx")).not.toContain("OPT-P0-CSS-02");
    expect(readSource("next.config.ts")).not.toContain("OPT-P0-CSS-02");
  });

  it("E: Auth CSS left Homepage index (completed by OPT-P0-CSS-03)", () => {
    const index = readSource("styles/rovexo/index.css");
    expect(index).not.toContain('@import "./auth-v1.css"');
    expect(existsSync(join(process.cwd(), "styles/rovexo/auth-v1.css"))).toBe(true);
  });

  it("G: owner imports added for live feature sheets (page-scoped)", () => {
    expect(readSource("features/account/components/ProfileEditPage.tsx")).toContain(
      'import "@/styles/rovexo/account-settings-v1.css"',
    );
    expect(readSource("features/account-module/components/SettingsMenuSections.tsx")).toContain(
      'import "@/styles/rovexo/account-settings-canonical.css"',
    );
    expect(readSource("features/account-module/components/RovexoIdeasPage.tsx")).toContain(
      'import "@/styles/rovexo/rovexo-ideas-v1.css"',
    );
    expect(readSource("features/account-module/components/PromotionToolsV1.tsx")).toContain(
      'import "@/styles/rovexo/promotion-cards-v1.css"',
    );
    expect(readSource("features/seller/migration/components/MigrationCenterPage.tsx")).toContain(
      'import "@/styles/rovexo/bring-your-item.css"',
    );
    expect(readSource("components/auth/RovexoSignOutLink.tsx")).toContain(
      'import "@/styles/rovexo/sign-out.css"',
    );
    expect(readSource("components/header/RvxTopBar.tsx")).toContain(
      'import "@/styles/rovexo/rvx-topbar-v1.css"',
    );
    expect(readSource("components/ui/PremiumEmptyStateImage.tsx")).toContain(
      'import "@/styles/rovexo/premium-empty-state.css"',
    );
    expect(readSource("components/platform-visual/VisualThemeScope.tsx")).toContain(
      'import "@/styles/rovexo/platform-visual.css"',
    );
    expect(readSource("components/ui/canonical/CanonicalSettingsSection.tsx")).toContain(
      'import "@/styles/rovexo/account-module-v1.css"',
    );
    expect(readSource("features/seller/migration/components/HeroSlideVisual.tsx")).toContain(
      'import "@/styles/rovexo/hero.css"',
    );
  });

  it("keeps store-listing-card-premium on Homepage path (Showcase)", () => {
    const index = readSource("styles/rovexo/index.css");
    expect(index).toContain('@import "./store-listing-card-premium-v1.css"');
    expect(sha256File("styles/rovexo/store-listing-card-premium-v1.css").length).toBe(64);
  });
});
