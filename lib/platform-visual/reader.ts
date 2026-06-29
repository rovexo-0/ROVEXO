import {
  AI_MANAGER_SETTING_KEY,
  BANNER_MANAGER_SETTING_KEY,
  createDefaultAiToggles,
  createDefaultBannerManagerConfig,
  createDefaultFeatureToggles,
  createDefaultHomepageBuilderConfig,
  FEATURE_MANAGER_SETTING_KEY,
  HOMEPAGE_BUILDER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import { getPlatformSetting } from "@/lib/super-admin/settings";
import {
  createDefaultMenuBuilderConfig,
  createDefaultThemeTokens,
  createDefaultVisualBundle,
  createDefaultVisualHistory,
} from "@/lib/platform-visual/defaults";
import {
  PLATFORM_VISUAL_DRAFT_KEY,
  PLATFORM_VISUAL_HISTORY_KEY,
  PLATFORM_VISUAL_MENUS_KEY,
  PLATFORM_VISUAL_THEME_KEY,
} from "@/lib/platform-visual/keys";
import { createDefaultStudioProDocument } from "@/lib/platform-visual/studio-pro/defaults";
import type {
  PlatformVisualBundle,
  PlatformVisualConfig,
  PlatformVisualHistoryEntry,
} from "@/lib/platform-visual/types";

import {
  resolvePublishedHomepageSections,
  resolveShellComponents,
} from "@/lib/platform-visual/resolver";

function normalizeVisualBundle(bundle: PlatformVisualBundle): PlatformVisualBundle {
  return {
    ...bundle,
    studioPro: bundle.studioPro ?? createDefaultStudioProDocument(bundle.homepageBuilder),
  };
}

async function readLiveBundle(): Promise<PlatformVisualBundle> {
  const [homepageBuilder, banners, menus, theme] = await Promise.all([
    getPlatformSetting(HOMEPAGE_BUILDER_SETTING_KEY, createDefaultHomepageBuilderConfig()),
    getPlatformSetting(BANNER_MANAGER_SETTING_KEY, createDefaultBannerManagerConfig()),
    getPlatformSetting(PLATFORM_VISUAL_MENUS_KEY, createDefaultMenuBuilderConfig()),
    getPlatformSetting(PLATFORM_VISUAL_THEME_KEY, createDefaultThemeTokens()),
  ]);

  return normalizeVisualBundle({
    version: 1,
    updatedAt: new Date().toISOString(),
    label: "Live",
    theme,
    homepageBuilder,
    banners,
    menus,
    studioPro: createDefaultStudioProDocument(homepageBuilder),
  });
}

function bundleToConfig(bundle: PlatformVisualBundle, mode: "live" | "draft"): PlatformVisualConfig {
  return {
    mode,
    updatedAt: bundle.updatedAt,
    theme: bundle.theme,
    homepageBuilder: bundle.homepageBuilder,
    banners: bundle.banners,
    menus: bundle.menus,
    publishedSections: resolvePublishedHomepageSections(bundle.homepageBuilder),
    shell: resolveShellComponents(bundle.homepageBuilder),
  };
}

export async function getPlatformVisualConfig(options?: {
  mode?: "live" | "draft";
}): Promise<PlatformVisualConfig> {
  const mode = options?.mode ?? "live";

  if (mode === "draft") {
    const draft = normalizeVisualBundle(
      await getPlatformSetting<PlatformVisualBundle>(PLATFORM_VISUAL_DRAFT_KEY, await readLiveBundle()),
    );
    return bundleToConfig(draft, "draft");
  }

  return bundleToConfig(await readLiveBundle(), "live");
}

export async function getPlatformVisualDraft(): Promise<PlatformVisualBundle> {
  return normalizeVisualBundle(
    await getPlatformSetting<PlatformVisualBundle>(PLATFORM_VISUAL_DRAFT_KEY, await readLiveBundle()),
  );
}

export async function getPlatformVisualHistory(): Promise<PlatformVisualHistoryEntry[]> {
  return getPlatformSetting(PLATFORM_VISUAL_HISTORY_KEY, createDefaultVisualHistory());
}

export async function ensurePlatformVisualDraft(): Promise<PlatformVisualBundle> {
  const draft = await getPlatformVisualDraft();
  const live = await readLiveBundle();
  const hasDraft = draft.updatedAt !== live.updatedAt || draft.label !== "Live";

  if (draft.label === "Live" && !hasDraft) {
    return {
      ...live,
      label: "Draft",
      updatedAt: new Date().toISOString(),
    };
  }

  return draft;
}

export async function createFreshDraftFromLive(): Promise<PlatformVisualBundle> {
  const live = await readLiveBundle();
  return {
    ...live,
    label: "Draft",
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultDraftBundle(): PlatformVisualBundle {
  return createDefaultVisualBundle("Draft");
}

/** Reads feature + AI settings for runtime gates (future wiring). */
export async function getPlatformRuntimeToggles() {
  const [features, ai] = await Promise.all([
    getPlatformSetting(FEATURE_MANAGER_SETTING_KEY, createDefaultFeatureToggles()),
    getPlatformSetting(AI_MANAGER_SETTING_KEY, createDefaultAiToggles()),
  ]);

  return { features, ai };
}
