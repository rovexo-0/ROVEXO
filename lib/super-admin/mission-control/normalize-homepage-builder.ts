import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import type { HomepageBuilderComponent, HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";

const DEPRECATED_HOMEPAGE_SECTION_IDS = new Set(["hero-slider", "business-spotlight"]);

const LAUNCH_PUBLISHED_SECTION_IDS = new Set([
  "category-rail",
  "all-listings",
]);

function disableDeprecatedSection(component: HomepageBuilderComponent): HomepageBuilderComponent {
  return {
    ...component,
    enabled: false,
    published: false,
    visibility: { desktop: false, tablet: false, mobile: false },
  };
}

/** Aligns stored Mission Control homepage config with the approved launch layout. */
export function normalizeHomepageBuilderConfigForLaunch(
  stored?: Partial<HomepageBuilderConfig> | null,
): HomepageBuilderConfig {
  const defaults = createDefaultHomepageBuilderConfig();

  if (!stored?.components?.length) {
    return defaults;
  }

  const storedById = new Map(stored.components.map((component) => [component.id, component]));

  const components = defaults.components.map((defaultComponent) => {
    const existing = storedById.get(defaultComponent.id);
    const merged: HomepageBuilderComponent = {
      ...defaultComponent,
      ...(existing ?? {}),
      id: defaultComponent.id,
      label: existing?.label ?? defaultComponent.label,
      order: defaultComponent.order,
      style: { ...defaultComponent.style, ...(existing?.style ?? {}) },
    };

    if (DEPRECATED_HOMEPAGE_SECTION_IDS.has(defaultComponent.id)) {
      return disableDeprecatedSection(merged);
    }

    if (LAUNCH_PUBLISHED_SECTION_IDS.has(defaultComponent.id)) {
      return {
        ...merged,
        enabled: true,
        published: true,
        visibility: defaultComponent.visibility,
      };
    }

    return merged;
  });

  return {
    version: defaults.version,
    updatedAt: stored.updatedAt ?? defaults.updatedAt,
    components,
  };
}
