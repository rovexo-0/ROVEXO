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
  });

  it("streams marketplace feed with Product Owner sections only", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    expect(homePage).toContain("CanonicalMarketplaceFeed");
    expect(homePage).toContain("FeaturedStoreSection");
    expect(homePage).not.toContain("HomepageV4Featured");
    expect(homePage).not.toContain("Recommended");
    expect(homePage).not.toContain("Newest");
    expect(homePage).not.toContain("Boosted");
    expect(homePage).not.toContain("RovexoBanner");
  });

  it("matches the approved launch homepage section order", () => {
    const sections = resolvePublishedHomepageSections(createDefaultHomepageBuilderConfig());
    const ids = sections.map((section) => section.id);
    expect(ids).toEqual([...LAUNCH_SECTION_ORDER]);
  });

  it("lists approved marketplace sources for the import wizard", () => {
    expect(BRING_YOUR_ITEMS_PLATFORMS.length).toBeGreaterThan(0);
  });

  it("renders the infinite marketplace feed on the homepage", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    expect(homePage).toContain("CanonicalMarketplaceFeed");
    expect(homePage).not.toContain("TrendingSearchesSection");
  });
});
