import type { Json } from "@/lib/supabase/types/database";
import {
  BANNER_MANAGER_SETTING_KEY,
  HOMEPAGE_BUILDER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditVisualChange } from "@/lib/platform-visual/audit";
import { createFreshDraftFromLive } from "@/lib/platform-visual/reader";
import { createDefaultVisualHistory } from "@/lib/platform-visual/defaults";
import type { PlatformVisualBundle, PlatformVisualHistoryEntry } from "@/lib/platform-visual/types";
import { readLiveBundle } from "@/lib/platform-visual/theme-engine.helpers";
import {
  PLATFORM_VISUAL_DRAFT_KEY,
  PLATFORM_VISUAL_HISTORY_KEY,
  PLATFORM_VISUAL_MENUS_KEY,
  PLATFORM_VISUAL_THEME_KEY,
} from "@/lib/platform-visual/keys";

export { readLiveBundle } from "@/lib/platform-visual/theme-engine.helpers";

export async function savePlatformVisualDraft(
  bundle: PlatformVisualBundle,
  actorId: string,
): Promise<PlatformVisualBundle> {
  const next = { ...bundle, updatedAt: new Date().toISOString(), label: "Draft" };
  await updatePlatformSetting({
    actorId,
    key: PLATFORM_VISUAL_DRAFT_KEY,
    value: next as unknown as Json,
  });
  await auditVisualChange({
    actorId,
    module: "theme-studio",
    action: "save-draft",
    newValue: { label: next.label, version: next.version },
    rollbackAvailable: true,
  });
  return next;
}

export async function publishPlatformVisualTheme(actorId: string): Promise<PlatformVisualBundle> {
  const [draft, live, history] = await Promise.all([
    getPlatformSetting<PlatformVisualBundle>(PLATFORM_VISUAL_DRAFT_KEY, await createFreshDraftFromLive()),
    readLiveBundle(),
    getPlatformSetting(PLATFORM_VISUAL_HISTORY_KEY, createDefaultVisualHistory()),
  ]);

  const historyEntry: PlatformVisualHistoryEntry = {
    id: `theme-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const nextHistory = [historyEntry, ...history].slice(0, 20);

  await Promise.all([
    updatePlatformSetting({ actorId, key: HOMEPAGE_BUILDER_SETTING_KEY, value: draft.homepageBuilder as Json }),
    updatePlatformSetting({ actorId, key: BANNER_MANAGER_SETTING_KEY, value: draft.banners as Json }),
    updatePlatformSetting({ actorId, key: PLATFORM_VISUAL_MENUS_KEY, value: draft.menus as Json }),
    updatePlatformSetting({
      actorId,
      key: PLATFORM_VISUAL_THEME_KEY,
      value: {
        primary: draft.studioPro.designTokens.primary,
        primaryDeep: draft.studioPro.designTokens.primaryDeep,
        background: draft.studioPro.designTokens.background,
        surface: draft.studioPro.designTokens.surface,
        textPrimary: draft.studioPro.designTokens.textPrimary,
        textSecondary: draft.studioPro.designTokens.textSecondary,
        radius: draft.studioPro.designTokens.radius,
        fontScale: draft.studioPro.designTokens.fontScale,
        shadow: draft.studioPro.designTokens.shadow,
      } as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: PLATFORM_VISUAL_DRAFT_KEY,
      value: { ...draft, label: "Live", updatedAt: new Date().toISOString() } as Json,
    }),
    updatePlatformSetting({ actorId, key: PLATFORM_VISUAL_HISTORY_KEY, value: nextHistory as Json }),
  ]);

  await auditVisualChange({
    actorId,
    module: "theme-studio",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: draft.label, version: draft.version },
    rollbackAvailable: true,
  });

  return { ...draft, label: "Live", updatedAt: new Date().toISOString() };
}

export async function rollbackPlatformVisualTheme(
  historyId: string,
  actorId: string,
): Promise<PlatformVisualBundle> {
  const history = await getPlatformSetting(PLATFORM_VISUAL_HISTORY_KEY, createDefaultVisualHistory());
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable);
  if (!entry) {
    throw new Error("Theme rollback entry not found.");
  }

  const bundle = entry.bundle;
  await Promise.all([
    updatePlatformSetting({ actorId, key: HOMEPAGE_BUILDER_SETTING_KEY, value: bundle.homepageBuilder as Json }),
    updatePlatformSetting({ actorId, key: BANNER_MANAGER_SETTING_KEY, value: bundle.banners as Json }),
    updatePlatformSetting({ actorId, key: PLATFORM_VISUAL_MENUS_KEY, value: bundle.menus as Json }),
    updatePlatformSetting({ actorId, key: PLATFORM_VISUAL_THEME_KEY, value: bundle.theme as Json }),
    updatePlatformSetting({ actorId, key: PLATFORM_VISUAL_DRAFT_KEY, value: { ...bundle, label: "Draft" } as Json }),
  ]);

  await auditVisualChange({
    actorId,
    module: "theme-studio",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: bundle.label, version: bundle.version },
    rollbackAvailable: false,
  });

  return { ...bundle, label: "Live", updatedAt: new Date().toISOString() };
}

export async function duplicatePlatformVisualTheme(actorId: string): Promise<PlatformVisualBundle> {
  const live = await readLiveBundle();
  const duplicate: PlatformVisualBundle = {
    ...live,
    label: `${live.label} Copy`,
    version: live.version + 1,
    updatedAt: new Date().toISOString(),
  };
  return savePlatformVisualDraft(duplicate, actorId);
}

export async function resetPlatformVisualDraft(actorId: string): Promise<PlatformVisualBundle> {
  const live = await createFreshDraftFromLive();
  return savePlatformVisualDraft(live, actorId);
}
