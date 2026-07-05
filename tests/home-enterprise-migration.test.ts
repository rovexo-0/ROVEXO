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

const V1_HOME_COMPONENTS = ["RovexoCategoryRail", "RovexoAllListings"];

const REMOVED_HOMEPAGE_SECTIONS = [
  "RovexoFeaturedListings",
  "RovexoRecommendedListings",
  "RovexoNewListings",
  "RovexoBoostListings",
  "RovexoPremiumListings",
  "RovexoBusinesses",
];

describe("Homepage enterprise migration contract", () => {
  it("renders RovexoHomePage from the approved v1 single-feed stack", () => {
    const page = readSource("app/page.tsx");
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    expect(page).toContain("RovexoHomePage");
    expect(page).toContain("BetaAppShell");
    expect(page).toContain("<Header variant=\"homepage\" />");
    expect(page).toContain("fetchHomepageFeed");
    expect(page).toContain("resolveHomepageFeedItems");
    expect(page).not.toContain("HomeContent");
    expect(page).not.toContain("getRecommendedBusinesses");
    expect(page).not.toContain("resolveLiveHeroSlides");
    expect(page).not.toContain("enrichHomepageData");

    for (const legacyImport of LEGACY_HOME_IMPORTS) {
      expect(homePage).not.toContain(legacyImport);
    }

    expect(homePage).not.toContain("HomeBenefitsRail");
    expect(homePage).not.toContain("HomeSecondaryBanners");
    expect(homePage).not.toContain("HomeHeroBannerEngine");

    for (const component of V1_HOME_COMPONENTS) {
      expect(homePage).toContain(component);
    }

    for (const section of REMOVED_HOMEPAGE_SECTIONS) {
      expect(homePage).not.toContain(section);
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

  it("wires scroll-hide chrome through a single app-level provider", () => {
    const shell = readSource("components/layout/AppShellLayout.tsx");
    const betaShell = readSource("components/beta/BetaAppShell.tsx");

    expect(shell).toContain("AppChromeScrollProvider");
    expect(betaShell).not.toContain("MobileHeaderScrollProvider");
    expect(betaShell).toContain("BottomNavigation");
  });

  it("wires header scroll-hide on mobile", () => {
    const header = readSource("components/Header.tsx");

    expect(header).toContain("isChromeVisible");
    expect(header).toContain("max-lg:-translate-y-full");
  });
});
