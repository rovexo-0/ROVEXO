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
  "HomeContent",
];

const PREMIUM_HOME_IMPORTS = [
  "PremiumHero",
  "ImportListingBanner",
  "InfiniteCategoryRail",
  "FeaturedListings",
  "RecommendedListings",
  "NewListings",
  "TrendingListings",
  "BusinessSection",
  "LatestListings",
  "DealsSection",
  "BenefitsSection",
];

describe("Homepage enterprise migration contract", () => {
  it("renders PremiumHomePage from the official premium component stack", () => {
    const page = readSource("app/page.tsx");
    const homeContent = readSource("components/premium/PremiumHomePage.tsx");

    expect(page).toContain("PremiumHomePage");
    expect(page).toContain("BetaAppShell");
    expect(page).toContain("PremiumHeader");
    expect(page).toContain('fetchProducts("popular"');
    expect(page).toContain('fetchProducts("recommended"');
    expect(page).toContain('fetchProducts("new"');
    expect(page).toContain('fetchProducts("trending"');
    expect(page).not.toContain("getRecommendedBusinesses");
    expect(page).not.toContain("resolveLiveHeroSlides");

    for (const legacyImport of LEGACY_HOME_IMPORTS) {
      expect(homeContent).not.toContain(legacyImport);
      expect(page).not.toContain(legacyImport);
    }

    for (const enterpriseImport of PREMIUM_HOME_IMPORTS) {
      expect(homeContent).toContain(enterpriseImport);
    }
  });

  it("keeps a single infinite category rail on the homepage", () => {
    const header = readSource("components/premium/PremiumHeader.tsx");
    const homeContent = readSource("components/premium/PremiumHomePage.tsx");

    expect(header).not.toContain("HeaderCategoryBar");
    expect(homeContent).not.toContain("HeaderCategoryBar");
    expect(homeContent).toContain("InfiniteCategoryRail");
  });

  it("does not render legacy Popular Near You section", () => {
    const homeContent = readSource("components/premium/PremiumHomePage.tsx");

    expect(homeContent).not.toContain("Popular Near You");
    expect(homeContent).not.toContain("popular-near-heading");
  });

  it("wires scroll-hide chrome through BetaAppShell", () => {
    const shell = readSource("components/beta/BetaAppShell.tsx");

    expect(shell).toContain("MobileHeaderScrollProvider");
    expect(shell).toContain("BottomNavigation");
  });
});
