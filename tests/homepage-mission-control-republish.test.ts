import { describe, expect, it } from "vitest";

import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import { normalizeHomepageBuilderConfigForLaunch } from "@/lib/super-admin/mission-control/normalize-homepage-builder";
import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";

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

      if (component.id === "bring-items") {
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
    expect(publishedIds[0]).toBe("top-category-bar");
    expect(publishedIds[1]).toBe("category-rail");
    expect(publishedIds[2]).toBe("bring-items");
  });

  it("restores approved launch section order from defaults", () => {
    const normalized = normalizeHomepageBuilderConfigForLaunch(createLegacyHomepageBuilderConfig());
    const hero = normalized.components.find((component) => component.id === "hero-slider");

    expect(hero?.enabled).toBe(false);
    expect(hero?.published).toBe(false);
    expect(resolvePublishedHomepageSections(normalized).map((section) => section.id)).toEqual(
      resolvePublishedHomepageSections(createDefaultHomepageBuilderConfig()).map((section) => section.id),
    );
  });
});
