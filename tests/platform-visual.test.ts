import { describe, expect, it } from "vitest";
import { HOME_HERO_BANNERS } from "@/lib/home/constants";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { createDefaultBannerManagerConfig } from "@/lib/super-admin/mission-control/defaults";
import {
  resolveHeroAutoAdvanceMs,
  resolveLiveHeroSlides,
  resolvePublishedHomepageSections,
  resolvePublishedMenuItems,
} from "@/lib/platform-visual/resolver";
import { createDefaultMenuBuilderConfig } from "@/lib/platform-visual/defaults";

describe("platform visual resolver", () => {
  it("returns published homepage sections in order", () => {
    const config = createDefaultHomepageBuilderConfig();
    const sections = resolvePublishedHomepageSections(config);
    expect(sections[0]?.id).toBe("top-category-bar");
    expect(sections.some((section) => section.id === "footer")).toBe(false);
  });

  it("maps banner manager config to hero slides", () => {
    const banners = createDefaultBannerManagerConfig();
    const slides = resolveLiveHeroSlides(banners, HOME_HERO_BANNERS);
    expect(slides.length).toBeGreaterThan(0);
    expect(slides[0]?.cta.length).toBeGreaterThan(0);
  });

  it("reads hero auto advance from banner config", () => {
    const banners = createDefaultBannerManagerConfig();
    expect(resolveHeroAutoAdvanceMs(banners)).toBeGreaterThan(0);
  });

  it("filters enabled menu items", () => {
    const menus = createDefaultMenuBuilderConfig();
    const bottomNav = resolvePublishedMenuItems(menus, "bottomNav");
    expect(bottomNav.every((item) => item.enabled)).toBe(true);
    expect(bottomNav.some((item) => item.id === "home")).toBe(true);
  });
});
