import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Homepage premium 2026 UI", () => {
  it("uses PremiumHomePage on the homepage route", () => {
    const page = readSource("app/page.tsx");
    expect(page).toContain("PremiumHomePage");
    expect(page).toContain("PremiumHeader");
    expect(page).not.toContain("HomeContent");
  });

  it("does not ship the deprecated homepage hero promotion components", () => {
    expect(() => readSource("components/home/HomeHeroBanner.tsx")).toThrow();
    expect(() => readSource("components/home/HomeContent.tsx")).toThrow();
  });

  it("renders the premium 2026 section stack", () => {
    const home = readSource("components/premium/PremiumHomePage.tsx");
    expect(home).toContain("PremiumHero");
    expect(home).toContain("ImportListingBanner");
    expect(home).toContain("InfiniteCategoryRail");
    expect(home).toContain("FeaturedListings");
    expect(home).toContain("RecommendedListings");
    expect(home).toContain("NewListings");
    expect(home).toContain("TrendingListings");
    expect(home).toContain("BusinessSection");
    expect(home).toContain("LatestListings");
    expect(home).toContain("DealsSection");
    expect(home).toContain("BenefitsSection");
  });

  it("import listing banner promotes under-60-second import", () => {
    const banner = readSource("components/premium/ImportListingBanner.tsx");
    expect(banner).toContain("Import Your Listing");
    expect(banner).toContain("in under 60 seconds");
    expect(banner).toContain("Import Listing");
  });

  it("builder defaults still exclude deprecated hero slider", () => {
    const sections = resolvePublishedHomepageSections(createDefaultHomepageBuilderConfig());
    const ids = sections.map((section) => section.id);
    expect(ids).not.toContain("hero-slider");
    expect(ids).not.toContain("top-category-bar");
  });
});
