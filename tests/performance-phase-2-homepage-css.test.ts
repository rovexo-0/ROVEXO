/**
 * Performance Phase 2 — Homepage render-blocking CSS (import graph only).
 * Does not rewrite tokens, fonts, HeaderProvider, SEO, or ListingCard delivery.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const ARCHIVE_HOME_SHEETS = [
  "home-polish.css",
  "home-product-cards.css",
  "home-final.css",
  "home-launch-polish.css",
  "home-sections-premium.css",
  "home-v1-launch-polish.css",
  "home-v1-visual-qa.css",
] as const;

const HOMEPAGE_REQUIRED_INDEX = [
  "listing-card-official.css",
  "store-listing-card-premium-v1.css",
  "category-rail.css",
  "bottom-nav-premium.css",
  "full-width-engine-v1.css",
  "compact-premium-v1.css",
] as const;

const PHASE_1_PROTECTED = [
  "components/ui/ListingCard.tsx",
  "components/ui/SafeImage.tsx",
  "components/homepage/canonical/constants.ts",
  "app/(platform)/page.tsx",
  "next.config.ts",
] as const;

describe("Performance Phase 2 homepage CSS", () => {
  it("keeps platform CSS on the platform layout (no architecture split)", () => {
    expect(readSource("app/(platform)/layout.tsx")).toContain('@/styles/rovexo/index.css');
    expect(readSource("app/layout.tsx")).not.toContain('@/styles/rovexo/index.css');
  });

  it("does not load archive Homepage sheets on the platform megabundle", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of ARCHIVE_HOME_SHEETS) {
      expect(index).not.toContain(`@import "./${sheet}"`);
      expect(existsSync(join(process.cwd(), `styles/rovexo/${sheet}`))).toBe(true);
    }
  });

  it("keeps live Homepage / chrome CSS on the platform path", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of HOMEPAGE_REQUIRED_INDEX) {
      expect(index).toContain(sheet);
    }
    expect(readSource("app/(platform)/page.tsx")).toContain("@/styles/homepage-canonical.css");
    expect(readSource("app/(platform)/page.tsx")).toContain("@/styles/homepage-canonical-responsive.css");
    expect(readSource("app/(platform)/page.tsx")).toContain("@/styles/rovexo/header-v2.css");
  });

  it("does not load Addresses CSS through platform-canonical-ui", () => {
    expect(readSource("styles/rovexo/platform-canonical-ui.css")).not.toContain(
      '@import "./addresses-v1.css"',
    );
    expect(readSource("features/account/components/addresses/AddressesPage.tsx")).toContain(
      'import "@/styles/rovexo/addresses-v1.css"',
    );
  });

  it("does not alter Geist / root globals or Phase 1 LCP files", () => {
    expect(readSource("app/layout.tsx")).toContain("Geist");
    expect(readSource("app/layout.tsx")).toContain('import "./globals.css"');
    for (const file of PHASE_1_PROTECTED) {
      expect(readSource(file)).not.toContain("PERF-P2");
    }
  });

  it("does not alter SEO Phase 1–5 homepage contracts in page.tsx", () => {
    const page = readSource("app/(platform)/page.tsx");
    expect(page).toContain("homePageJsonLd");
    expect(page).toContain("canonicalForHomepage");
    expect(page).toContain('<link rel="canonical"');
  });
});
