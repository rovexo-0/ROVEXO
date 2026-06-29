import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";
import { BRING_YOUR_ITEMS_PLATFORMS } from "@/components/home/BringYourItemsBanner";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const LAUNCH_SECTION_ORDER = [
  "top-category-bar",
  "category-rail",
  "bring-items",
  "popular-auctions",
  "featured-listings",
  "recommended",
  "new-listings",
  "latest-listings",
  "continue-browsing",
  "trending-searches",
] as const;

describe("Homepage launch recovery", () => {
  it("removes the App Store premium marketplace banner from homepage content", () => {
    const homeContent = readSource("components/home/HomeContent.tsx");
    expect(homeContent).not.toMatch(/from "@\/components\/home\/HomeHeroBanner"/);
    expect(homeContent).not.toContain("AppStoreButtons");
    expect(homeContent).not.toContain("Official ROVEXO");
    expect(homeContent).not.toContain("HomeHeroBannerEngine");
    expect(homeContent).not.toContain("hero-slider");
  });

  it("does not ship the deprecated homepage hero promotion components", () => {
    expect(() => readSource("components/home/HomeHeroBanner.tsx")).toThrow();
    expect(() => readSource("components/home/HomeHeroSearch.tsx")).toThrow();
    expect(() => readSource("components/home/AppStoreButtons.tsx")).toThrow();
  });

  it("matches the approved launch homepage section order", () => {
    const sections = resolvePublishedHomepageSections(createDefaultHomepageBuilderConfig());
    const ids = sections.map((section) => section.id);
    const launchIds = ids.slice(0, LAUNCH_SECTION_ORDER.length);
    expect(launchIds).toEqual([...LAUNCH_SECTION_ORDER]);
    expect(ids).not.toContain("hero-slider");
  });

  it("lists approved marketplace sources on the bring-items banner", () => {
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
});
