import { HOME_HERO_BANNERS, type HomeHeroBannerSlide } from "@/lib/home/constants";
import type { BannerManagerConfig } from "@/lib/super-admin/mission-control/types";
import type { HomepageBuilderComponent, HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";
import type { MenuBuilderConfig, MenuItemConfig } from "@/lib/platform-visual/types";

const SHELL_COMPONENT_IDS = new Set(["header", "search", "footer", "bottom-navigation"]);

export function resolvePublishedHomepageSections(
  config: HomepageBuilderConfig,
): HomepageBuilderComponent[] {
  return config.components
    .filter(
      (component) =>
        component.enabled &&
        component.published &&
        !SHELL_COMPONENT_IDS.has(component.id) &&
        component.id !== "hero-slider" &&
        component.id !== "business-spotlight",
    )
    .sort((a, b) => a.order - b.order);
}

export function resolveShellComponents(config: HomepageBuilderConfig) {
  const byId = new Map(config.components.map((component) => [component.id, component]));

  return {
    header: byId.get("header") ?? null,
    search: byId.get("search") ?? null,
    footer: byId.get("footer") ?? null,
    bottomNavigation: byId.get("bottom-navigation") ?? null,
  };
}

export function resolveLiveHeroSlides(
  banners: BannerManagerConfig,
  fallback: HomeHeroBannerSlide[] = HOME_HERO_BANNERS,
): HomeHeroBannerSlide[] {
  const fallbackById = new Map(fallback.map((slide) => [slide.id, slide]));
  const resolved = banners.banners
    .filter((banner) => banner.enabled && banner.published)
    .sort((a, b) => a.order - b.order)
    .map((banner) => {
      const base = fallbackById.get(banner.id);
      return {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle ?? base?.subtitle,
        cta: banner.cta,
        href: banner.href,
        theme: base?.theme ?? "blue",
        icon: base?.icon,
        categoryKey: base?.categoryKey,
        image: banner.image ?? base?.image,
        headingId: base?.headingId ?? `hero-${banner.id}`,
      } satisfies HomeHeroBannerSlide;
    });

  return resolved.length > 0 ? resolved : fallback;
}

export function resolveHeroAutoAdvanceMs(banners: BannerManagerConfig): number {
  const active = banners.banners.find((banner) => banner.enabled && banner.published);
  return active?.transitionMs ?? 5000;
}

export function resolvePublishedMenuItems(menu: MenuBuilderConfig, key: keyof MenuBuilderConfig): MenuItemConfig[] {
  const items = menu[key];
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item.enabled).sort((a, b) => a.order - b.order);
}

export function isShellComponentVisible(
  component: HomepageBuilderComponent | null,
  viewport: "desktop" | "tablet" | "mobile",
): boolean {
  if (!component) return true;
  if (!component.enabled || !component.published) return false;
  return component.visibility[viewport];
}
