import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const LEGACY_HOME_IMPORTS = [
  '@/components/home/HomePromoBanner"',
  '@/components/home/HomeHero"',
  '@/components/home/CategoryGridSection"',
  '@/components/home/PopularListingsGrid"',
  '@/components/home/QuickFiltersRail"',
  '@/components/home/HomeTrendingSearchesSection"',
  '@/components/home/ProductSection"',
  '@/components/home/HomeHeroSearch"',
  '@/components/home/HomeHeroBanner"',
];

const V4_HOME_COMPONENTS = [
  "CanonicalCategoryRail",
  "FeaturedStoreSection",
  "CanonicalMarketplaceFeed",
];

const FORBIDDEN_SECTIONS = [
  "Recommended",
  "Newest",
  "Boosted",
  "Trending",
  "Popular Near You",
  "RovexoFeaturedListings",
  "RovexoRecommendedListings",
  "RovexoNewListings",
  "RovexoBoostListings",
  "HomepageV3ListingRail",
];

describe("Homepage enterprise migration contract", () => {
  it("renders CanonicalHomepage with the Product Owner section stack only", () => {
    const page = readSource("app/page.tsx");
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");

    expect(page).toContain("CanonicalHomepage");
    expect(page).toContain("RovexoHeaderV2");
    expect(page).toContain("resolveHomepageV4Sections");
    expect(page).toContain("fetchHomepageFeed");
    expect(page).toContain('fetchProducts("recommended"');
    expect(page).not.toContain('fetchProducts("popular"');
    expect(page).not.toContain('fetchProducts("new"');
    expect(page).not.toContain('fetchProducts("trending"');
    expect(page).not.toContain("HomepageV3");
    expect(page).not.toContain("resolveHomepageV3Sections");

    for (const legacyImport of LEGACY_HOME_IMPORTS) {
      expect(homePage).not.toContain(legacyImport);
    }

    for (const component of V4_HOME_COMPONENTS) {
      expect(homePage).toContain(component);
    }

    for (const section of FORBIDDEN_SECTIONS) {
      expect(homePage).not.toContain(section);
    }
  });

  it("keeps search in header and category rail in the homepage main column", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");

    expect(header).not.toContain("HeaderCategoryBar");
    expect(header).toContain("HomepageSearchField");
    expect(homePage).toContain("CanonicalCategoryRail");
    expect(homePage).not.toContain("HomepageV4Search");
  });

  it("wires scroll-hide chrome through a single app-level provider", () => {
    const shell = readSource("components/layout/AppShellLayout.tsx");
    const betaShell = readSource("components/beta/BetaAppShell.tsx");

    expect(shell).toContain("AppChromeScrollProvider");
    expect(betaShell).toContain("BottomNavigation");
  });

  it("wires header scroll-hide on mobile", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");

    expect(header).toContain("isChromeVisible");
    expect(header).toContain("max-lg:-translate-y-full");
  });
});
