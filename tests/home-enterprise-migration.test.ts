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
  '@/components/home/HomeRecentlyViewedCarousel"',
  '@/components/home/HomeTrendingSearchesSection"',
  '@/components/home/TrendingSearchesSection"',
  '@/components/home/ProductSection"',
  '@/components/home/HomeHeroSearch"',
];

const ENTERPRISE_HOME_IMPORTS = [
  "HomeHeroBanner",
  "HomeCategoryRail",
  "StoreMigrationHeroBanner",
  "ProductCarouselSection",
  "AuctionsSection",
];

describe("Homepage enterprise migration contract", () => {
  it("renders HomeContent from the official enterprise component stack", () => {
    const page = readSource("app/page.tsx");
    const homeContent = readSource("components/home/HomeContent.tsx");

    expect(page).toContain("HomeContent");
    expect(page).toContain("BetaAppShell");
    expect(page).toContain("<Header />");
    expect(page).not.toMatch(/popularHasMore|fetchProducts\("popular"/i);

    for (const legacyImport of LEGACY_HOME_IMPORTS) {
      expect(homeContent).not.toContain(legacyImport);
    }

    for (const enterpriseImport of ENTERPRISE_HOME_IMPORTS) {
      expect(homeContent).toContain(enterpriseImport);
    }
  });

  it("keeps the approved v1.0 homepage section order", () => {
    const homeContent = readSource("components/home/HomeContent.tsx");

    const heroIndex = homeContent.indexOf("<HomeHeroBanner");
    const categoryIndex = homeContent.indexOf("<HomeCategoryRail");
    const bannerIndex = homeContent.indexOf("<StoreMigrationHeroBanner");
    const featuredIndex = homeContent.indexOf('title="Featured Listings"');
    const recommendedIndex = homeContent.indexOf('title="Recommended For You"');
    const auctionsIndex = homeContent.indexOf("<AuctionsSection");
    const latestIndex = homeContent.indexOf('title="Latest Listings"');

    expect(heroIndex).toBeGreaterThan(-1);
    expect(categoryIndex).toBeGreaterThan(heroIndex);
    expect(bannerIndex).toBeGreaterThan(categoryIndex);
    expect(featuredIndex).toBeGreaterThan(bannerIndex);
    expect(recommendedIndex).toBeGreaterThan(featuredIndex);
    expect(auctionsIndex).toBeGreaterThan(recommendedIndex);
    expect(latestIndex).toBeGreaterThan(auctionsIndex);
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
});
