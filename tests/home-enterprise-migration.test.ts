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

  '@/components/home/TrendingSearchesSection"',

  '@/components/home/ProductSection"',

  '@/components/home/HomeHeroSearch"',

];



const PREMIUM_HOME_IMPORTS = [

  "HomeCategoryRail",

  "HomeHeroBannerEngine",

  "ProductCarouselSection",

  "LiveAuctionsSection",

  "BusinessSpotlightSection",

  "HomeContinueBrowsingCarousel",

];



describe("Homepage enterprise migration contract", () => {

  it("renders HomeContent from the official premium component stack", () => {

    const page = readSource("app/page.tsx");

    const homeContent = readSource("components/home/HomeContent.tsx");



    expect(page).toContain("HomeContent");

    expect(page).toContain("BetaAppShell");

    expect(page).toContain("<Header />");

    expect(page).toContain('fetchProducts("recommended"');

    expect(page).toContain('fetchProducts("new"');

    expect(page).toContain("getAuctionsPageData");

    expect(page).toContain("getRecommendedBusinesses");



    for (const legacyImport of LEGACY_HOME_IMPORTS) {

      expect(homeContent).not.toContain(legacyImport);

    }



    expect(homeContent).not.toMatch(/from "@\/components\/home\/HomeHeroBanner"/);

    expect(homeContent).not.toContain("HomeBenefitsRail");

    expect(homeContent).not.toContain("HomeSecondaryBanners");

    for (const enterpriseImport of PREMIUM_HOME_IMPORTS) {
      expect(homeContent).toContain(enterpriseImport);
    }
  });

  it("uses a single homepage category carousel without header duplicate pills", () => {
    const header = readSource("components/Header.tsx");
    const homeContent = readSource("components/home/HomeContent.tsx");

    expect(header).not.toContain("HeaderCategoryBar");
    expect(homeContent).toContain("HomeCategoryRail");
  });



  it("keeps the approved v1.0 premium homepage section order", () => {

    const homeContent = readSource("components/home/HomeContent.tsx");



    const categoryIndex = homeContent.indexOf("HomeCategoryRail");

    const bannerIndex = homeContent.indexOf("<HomeHeroBannerEngine");

    const recommendedIndex = homeContent.indexOf('title="Recommended"');

    const recentlyListedIndex = homeContent.indexOf('title="Recently Listed"');

    const auctionsIndex = homeContent.indexOf("<LiveAuctionsSection");

    const businessIndex = homeContent.indexOf("<BusinessSpotlightSection");

    const continueIndex = homeContent.indexOf("<HomeContinueBrowsingCarousel");



    expect(categoryIndex).toBeGreaterThan(-1);

    expect(bannerIndex).toBeGreaterThan(categoryIndex);

    expect(recommendedIndex).toBeGreaterThan(bannerIndex);

    expect(recentlyListedIndex).toBeGreaterThan(recommendedIndex);

    expect(auctionsIndex).toBeGreaterThan(recentlyListedIndex);

    expect(businessIndex).toBeGreaterThan(auctionsIndex);

    expect(continueIndex).toBeGreaterThan(businessIndex);

  });



  it("does not render legacy Popular Near You section", () => {

    const homeContent = readSource("components/home/HomeContent.tsx");



    expect(homeContent).not.toContain("Popular Near You");

    expect(homeContent).not.toContain("popular-near-heading");

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

