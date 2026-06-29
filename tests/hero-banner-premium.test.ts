import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { HERO_CATEGORY_SLIDE_MAP } from "@/lib/home/hero-slide-map";
import { ROVEXO_CATEGORY_PREMIUM_KEYS } from "@/lib/home/category-premium-library";

describe("Hero banner category synchronization", () => {
  it("maps every category rail icon to a hero campaign slide", () => {
    for (const key of ROVEXO_CATEGORY_PREMIUM_KEYS) {
      expect(HERO_CATEGORY_SLIDE_MAP[key]).toBeTruthy();
    }
  });

  it("wires lightweight sync without modifying the category rail component", () => {
    const homeContent = readFileSync(
      path.join(process.cwd(), "components/home/HomeContent.tsx"),
      "utf8",
    );
    const categoryRail = readFileSync(
      path.join(process.cwd(), "components/home/HomeCategoryRail.tsx"),
      "utf8",
    );

    expect(homeContent).toContain("HeroCategorySyncProvider");
    expect(homeContent).toContain("HomeCategoryRailSync");
    expect(categoryRail).not.toContain("HeroCategorySync");
  });

  it("uses local hero campaign assets with AVIF and WebP support", () => {
    const heroImages = readFileSync(path.join(process.cwd(), "lib/home/hero-images.ts"), "utf8");
    const constants = readFileSync(path.join(process.cwd(), "lib/home/constants.ts"), "utf8");
    const campaignLibrary = readFileSync(
      path.join(process.cwd(), "lib/home/hero-campaign-library.ts"),
      "utf8",
    );

    expect(heroImages).toContain("getHeroCampaignWebpSrc");
    expect(heroImages).not.toContain("unsplash.com");
    expect(campaignLibrary).toContain("getHeroCampaignAvifSrc");
    expect(campaignLibrary).toContain("getHeroCampaignPngSrc");
    expect(campaignLibrary).toContain("getHeroCampaignSrcSet");
    expect(campaignLibrary).toContain("/hero/");
    expect(constants).toContain("heroCampaignImage");
    expect(constants).not.toContain("unsplash.com");
  });
});
