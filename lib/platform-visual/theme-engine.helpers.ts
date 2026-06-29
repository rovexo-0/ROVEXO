import {
  BANNER_MANAGER_SETTING_KEY,
  createDefaultBannerManagerConfig,
  createDefaultHomepageBuilderConfig,
  HOMEPAGE_BUILDER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import { normalizeHomepageBuilderConfigForLaunch } from "@/lib/super-admin/mission-control/normalize-homepage-builder";
import { getPlatformSetting } from "@/lib/super-admin/settings";
import {
  createDefaultMenuBuilderConfig,
  createDefaultThemeTokens,
} from "@/lib/platform-visual/defaults";
import { createDefaultStudioProDocument } from "@/lib/platform-visual/studio-pro/defaults";
import {
  PLATFORM_VISUAL_MENUS_KEY,
  PLATFORM_VISUAL_THEME_KEY,
} from "@/lib/platform-visual/keys";
import type { PlatformVisualBundle } from "@/lib/platform-visual/types";

export async function readLiveBundle(): Promise<PlatformVisualBundle> {
  const [homepageBuilderRaw, banners, menus, theme] = await Promise.all([
    getPlatformSetting(HOMEPAGE_BUILDER_SETTING_KEY, createDefaultHomepageBuilderConfig()),
    getPlatformSetting(BANNER_MANAGER_SETTING_KEY, createDefaultBannerManagerConfig()),
    getPlatformSetting(PLATFORM_VISUAL_MENUS_KEY, createDefaultMenuBuilderConfig()),
    getPlatformSetting(PLATFORM_VISUAL_THEME_KEY, createDefaultThemeTokens()),
  ]);
  const homepageBuilder = normalizeHomepageBuilderConfigForLaunch(homepageBuilderRaw);

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    label: "Live",
    theme,
    homepageBuilder,
    banners,
    menus,
    studioPro: createDefaultStudioProDocument(homepageBuilder),
  };
}
