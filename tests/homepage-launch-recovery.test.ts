import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";
import { BRING_YOUR_ITEMS_PLATFORMS } from "@/components/home/constants";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const LAUNCH_SECTION_ORDER = ["category-rail", "all-listings"] as const;

describe("Homepage launch recovery", () => {
  it("removes deprecated homepage hero promotion components only", () => {
    expect(() => readSource("components/home/HomeHeroBanner.tsx")).toThrow();
    expect(() => readSource("components/home/HomeHeroSearch.tsx")).toThrow();
    expect(() => readSource("components/home/AppStoreButtons.tsx")).toThrow();
  });

  it("streams All Listings directly below the category rail", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");
    expect(homePage).not.toContain("HomeHeroBannerEngine");
    expect(homePage).not.toContain("RovexoBanner");
    expect(homePage).toContain("RovexoAllListings");
    expect(homePage).not.toContain("RovexoFeaturedListings");
    expect(homePage).not.toContain("AppStoreButtons");
    expect(homePage).not.toContain("HeaderCategoryBar");
  });

  it("matches the approved launch homepage section order", () => {
    const sections = resolvePublishedHomepageSections(createDefaultHomepageBuilderConfig());
    const ids = sections.map((section) => section.id);
    expect(ids).toEqual([...LAUNCH_SECTION_ORDER]);
    expect(ids).not.toContain("hero-slider");
    expect(ids).not.toContain("top-category-bar");
    expect(ids).not.toContain("featured-listings");
  });

  it("lists approved marketplace sources for the import wizard", () => {
    expect(BRING_YOUR_ITEMS_PLATFORMS).toEqual([
      "Facebook Marketplace",
      "eBay",
      "Amazon",
      "Etsy",
      "Vinted",
      "Depop",
      "Shopify",
    ]);
  });

  it("renders the infinite all listings feed on the homepage", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");
    expect(homePage).toContain("RovexoAllListings");
    expect(homePage).not.toContain("TrendingSearchesSection");
    expect(homePage).not.toContain("HomeContinueBrowsingCarousel");
  });
});
