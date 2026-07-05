import { describe, expect, it } from "vitest";

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

import { join } from "node:path";



function readSource(relativePath: string): string {

  return readFileSync(join(process.cwd(), relativePath), "utf8");

}



function walkTsxFiles(dir: string, files: string[] = []): string[] {

  for (const entry of readdirSync(dir)) {

    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {

      if (entry !== "hooks") walkTsxFiles(full, files);

      continue;

    }

    if (entry.endsWith(".tsx")) files.push(full);

  }

  return files;

}



const REMOVED_HOMEPAGE_SECTIONS = [

  "RovexoFeaturedListings",

  "RovexoRecommendedListings",

  "RovexoNewListings",

  "RovexoBoostListings",

  "RovexoPremiumListings",

  "RovexoBusinesses",

  "RovexoListingCarouselSection",

];



const FORBIDDEN_HOMEPAGE_CARD_NAMES = [

  "FeaturedCard",

  "PremiumCard",

  "BoostCard",

  "NewListingCard",

  "LatestListingCard",

  "CompactListingCard",

  "CompactCard",

  "HorizontalListingCard",

  "HorizontalCard",

  "RailCard",

  "MiniListingCard",

  "MiniCard",

  "LegacyListingCard",

  "LegacyCard",

  "RovexoBusinessCard",

  "BusinessCard",

  "ProductCard",

  "PremiumProductCard",

];



describe("Homepage Canonical Listing Card — UI Lock v1.0 enforcement", () => {

  it("defines grid spacing SSOT with padding on main only", () => {

    const lock = readSource("styles/rovexo/home-listing-grid-lock.css");

    const homepage = readSource("styles/rovexo-homepage.css");



    expect(homepage).toContain("--rx-home-grid-gap-x: 12px");

    expect(homepage).toContain("--rx-home-grid-gap-y: 20px");

    expect(homepage).toContain("--rx-home-listing-card-h: 300px");

    expect(homepage).toContain("--rx-home-listing-card-media-h: 190px");

    expect(homepage).toContain("--rx-home-listing-card-body-h: 110px");

    expect(homepage).toContain("--rx-home-listing-card-shadow: 0 8px 24px rgba(0, 0, 0, 0.06)");

    expect(lock).toMatch(/\[class\*="body"\][\s\S]*?justify-content:\s*space-between/);

  });



  it("locks official card dimensions and typography", () => {

    const lock = readSource("styles/rovexo/home-listing-grid-lock.css");



    expect(lock).toContain("height: var(--rx-home-listing-card-h)");

    expect(lock).toContain("height: var(--rx-home-listing-card-media-h)");

    expect(lock).toContain("height: var(--rx-home-listing-card-body-h)");

    expect(lock).toMatch(/\[class\*="title"\][\s\S]*?white-space:\s*nowrap/);

    expect(lock).toMatch(/\[class\*="price"\][\s\S]*?color:\s*#2563eb/);

    expect(lock).toMatch(/\[class\*="protection"\][\s\S]*?font-size:\s*13px/);

    expect(lock).toMatch(/\[class\*="metaCondition"\][\s\S]*?font-size:\s*14px/);

  });



  it("requires the homepage All Listings feed to use the canonical ListingCard", () => {

    const allListings = readSource("components/home/RovexoAllListings.tsx");

    expect(allListings).toContain('@/components/ui/ListingCard"');

    expect(allListings).toContain("HOMEPAGE_LISTING_CARD_PROPS");

    for (const forbidden of FORBIDDEN_HOMEPAGE_CARD_NAMES) {

      expect(allListings, `must not reference ${forbidden}`).not.toContain(forbidden);

    }

  });



  it("does not ship duplicate homepage listing card components", () => {

    const homeFiles = walkTsxFiles(join(process.cwd(), "components/home"));

    const duplicateCardFiles = homeFiles.filter((file) =>

      /Card\.tsx$/.test(file) &&

      !file.endsWith("RovexoCategoryCard.tsx") &&

      !file.endsWith("ListingCard.tsx"),

    );



    expect(duplicateCardFiles).toEqual([]);

    expect(existsSync(join(process.cwd(), "components/home/RovexoBusinessCard.tsx"))).toBe(false);

  });



  it("uses only the All Listings grid feed on the homepage", () => {

    const homePage = readSource("components/home/RovexoHomePage.tsx");

    const grid = readSource("components/home/RovexoAllListingsGrid.tsx");

    const allListings = readSource("components/home/RovexoAllListings.tsx");



    expect(homePage).toContain("RovexoAllListings");

    expect(homePage).not.toContain("home-v1-listing-scroller");

    for (const section of REMOVED_HOMEPAGE_SECTIONS) {

      expect(homePage).not.toContain(section);

    }



    expect(grid).toContain('data-homepage-listing-container="grid"');

    expect(grid).toContain("home-v1-listing-grid-lock");

    expect(allListings).toContain("RovexoAllListingsGrid");

    expect(allListings).not.toContain("home-v1-listing-scroller");

    expect(allListings).not.toContain("All Listings");

    expect(allListings).not.toContain("all-listings-heading");

    expect(allListings).toContain('aria-label="Marketplace listings"');

  });



  it("does not reserve duplicate mobile header space above the homepage search bar", () => {

    const scroll = readSource("components/home/RovexoMobileHeaderScrollContext.tsx");

    const homepage = readSource("styles/rovexo-homepage.css");



    expect(scroll).not.toContain("rovexo-chrome-spacer");

    expect(homepage).toContain("padding-top: env(safe-area-inset-top");

  });



  it("does not constrain listing grid width with nested max-width or padding", () => {

    const homepage = readSource("styles/rovexo-homepage.css");

    expect(homepage).not.toContain("max-width: var(--rovexo-content-width)");

  });



  it("keeps ListingCard visuals independent of variant", () => {

    const card = readSource("components/ui/ListingCard.tsx");

    const moduleCss = readSource("components/ui/ListingCard.module.css");

    const lock = readSource("styles/rovexo/home-listing-grid-lock.css");



    expect(card).not.toMatch(/variant\s*===/);

    expect(card).not.toContain("styles.carousel");

    expect(card).not.toContain("data-variant");

    expect(moduleCss).not.toMatch(/\.carousel\b/);

    expect(lock).not.toContain('[data-variant="carousel"]');

  });

});

