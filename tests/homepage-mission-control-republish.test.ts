import { describe, expect, it } from "vitest";

import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { normalizeHomepageBuilderConfigForLaunch } from "@/lib/super-admin/mission-control/normalize-homepage-builder";
import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";

const LAUNCH_PUBLISHED_SECTION_IDS = ["category-rail", "all-listings"] as const;

function createLegacyHomepageBuilderConfig(): HomepageBuilderConfig {
  const defaults = createDefaultHomepageBuilderConfig();

  return {
    ...defaults,
    components: defaults.components.map((component) => {
      if (component.id === "hero-slider") {
        return {
          ...component,
          enabled: true,
          published: true,
          order: 2,
          visibility: { desktop: true, tablet: true, mobile: true },
        };
      }

      if (component.id === "all-listings") {
        return { ...component, enabled: false, published: false };
      }

      if (component.id === "top-category-bar") {
        return { ...component, enabled: false, published: false };
      }

      return component;
    }),
  };
}

describe("normalizeHomepageBuilderConfigForLaunch", () => {
  it("removes hero slider from published launch sections", () => {
    const normalized = normalizeHomepageBuilderConfigForLaunch(createLegacyHomepageBuilderConfig());
    const publishedIds = resolvePublishedHomepageSections(normalized).map((section) => section.id);

    expect(publishedIds).not.toContain("hero-slider");
    expect(publishedIds[0]).toBe("category-rail");
    expect(publishedIds[1]).toBe("all-listings");
    expect(publishedIds).toEqual([...LAUNCH_PUBLISHED_SECTION_IDS]);
  });

  it("restores approved launch section order from defaults", () => {
    const normalized = normalizeHomepageBuilderConfigForLaunch(createLegacyHomepageBuilderConfig());
    const hero = normalized.components.find((component) => component.id === "hero-slider");
    const allListings = normalized.components.find((component) => component.id === "all-listings");

    expect(hero?.enabled).toBe(false);
    expect(hero?.published).toBe(false);
    expect(allListings?.enabled).toBe(true);
    expect(allListings?.published).toBe(true);
    expect(resolvePublishedHomepageSections(normalized).map((section) => section.id)).toEqual([
      ...LAUNCH_PUBLISHED_SECTION_IDS,
    ]);
  });
});
