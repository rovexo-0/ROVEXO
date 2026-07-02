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

const V1_HOME_COMPONENTS = [
  "RovexoCategoryRail",
  "RovexoBanner",
  "RovexoFeaturedListings",
  "RovexoRecommendedListings",
  "RovexoNewListings",
  "RovexoBoostListings",
  "RovexoPremiumListings",
  "RovexoBusinesses",
  "RovexoAllListings",
];

describe("Homepage enterprise migration contract", () => {
  it("renders RovexoHomePage from the approved v1 component stack", () => {
    const page = readSource("app/page.tsx");
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    expect(page).toContain("RovexoHomePage");
    expect(page).toContain("BetaAppShell");
    expect(page).toContain("<Header />");
    expect(page).toContain('fetchProducts("popular"');
    expect(page).toContain('fetchProducts("recommended"');
    expect(page).toContain('fetchProducts("new"');
    expect(page).toContain("enrichHomepageData");
    expect(page).not.toContain("HomeContent");
    expect(page).not.toContain("getRecommendedBusinesses");
    expect(page).not.toContain("resolveLiveHeroSlides");

    for (const legacyImport of LEGACY_HOME_IMPORTS) {
      expect(homePage).not.toContain(legacyImport);
    }

    expect(homePage).not.toContain("HomeBenefitsRail");
    expect(homePage).not.toContain("HomeSecondaryBanners");
    expect(homePage).not.toContain("HomeHeroBannerEngine");

    for (const component of V1_HOME_COMPONENTS) {
      expect(homePage).toContain(component);
    }
  });

  it("keeps a single category rail on the homepage", () => {
    const header = readSource("components/Header.tsx");
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    expect(header).not.toContain("HeaderCategoryBar");
    expect(homePage).not.toContain("HeaderCategoryBar");
    expect(homePage).toContain("RovexoCategoryRail");
  });

  it("does not render legacy Popular Near You section", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    expect(homePage).not.toContain("Popular Near You");
    expect(homePage).not.toContain("popular-near-heading");
  });

  it("wires scroll-hide chrome through BetaAppShell", () => {
    const shell = readSource("components/beta/BetaAppShell.tsx");

    expect(shell).toContain("MobileHeaderScrollProvider");
    expect(shell).toContain("BottomNavigation");
  });

  it("wires header scroll-hide on mobile", () => {
    const header = readSource("components/Header.tsx");

    expect(header).toContain("isChromeVisible");
    expect(header).toContain("max-lg:-translate-y-full");
  });
});
