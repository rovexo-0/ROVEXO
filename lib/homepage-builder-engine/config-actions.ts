import { canPerformHomepageAction } from "@/lib/homepage-builder-engine/audit";
import {
  homepageBuilderConfigLifecycle,
  type HomepageBuilderConfigDocument,
} from "@/lib/homepage-builder-engine/config";
import { preparePublishDocument, validateHomepageDocument } from "@/lib/homepage-builder-engine/publish";
import { duplicateHomepageDocument, importHomepageBundle } from "@/lib/homepage-builder-engine/versioning";
import { HOMEPAGE_BUILDER_SETTING_KEY } from "@/lib/super-admin/mission-control/defaults";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isHomepageBuilderConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

async function syncMissionControlHomepage(_production: HomepageBuilderConfigDocument["settings"]["production"], actorId: string) {
  const { getPlatformSetting, updatePlatformSetting } = await import("@/lib/super-admin/settings");
  const existing = await getPlatformSetting(HOMEPAGE_BUILDER_SETTING_KEY, createDefaultHomepageBuilderConfig());
  await updatePlatformSetting({
    actorId,
    key: HOMEPAGE_BUILDER_SETTING_KEY,
    value: { ...existing, updatedAt: new Date().toISOString() },
  });
}

export async function executeHomepageBuilderConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: HomepageBuilderConfigDocument; historyId?: string },
): Promise<HomepageBuilderConfigDocument | { exported: HomepageBuilderConfigDocument } | void> {
  const permission = canPerformHomepageAction({
    action: action === "publish" ? "publish" : action === "rollback" ? "rollback" : action,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return homepageBuilderConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish": {
      const draft = await homepageBuilderConfigLifecycle.getDraft();
      const validation = validateHomepageDocument(draft.settings.draft);
      if (!validation.valid) throw new Error(validation.errors.join("; "));
      const published = preparePublishDocument(draft.settings.draft, actorId);
      const nextDraft = {
        ...draft,
        settings: {
          ...draft.settings,
          production: published,
          draft: { ...published, label: "Draft" as const },
        },
      };
      await homepageBuilderConfigLifecycle.saveDraft(nextDraft, actorId);
      const live = await homepageBuilderConfigLifecycle.publish(actorId);
      await syncMissionControlHomepage(published, actorId);
      return live;
    }
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      const restored = await homepageBuilderConfigLifecycle.rollback(payload.historyId, actorId);
      await syncMissionControlHomepage(restored.settings.production, actorId);
      return restored;
    }
    case "import-config": {
      if (!payload?.document) throw new Error("document required");
      return homepageBuilderConfigLifecycle.importDocument(payload.document, actorId);
    }
    case "export-config":
      return { exported: await homepageBuilderConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}

export async function duplicateHomepage(actorId: string) {
  const draft = await homepageBuilderConfigLifecycle.getDraft();
  const dup = duplicateHomepageDocument(draft.settings.draft);
  const next = {
    ...draft,
    settings: { ...draft.settings, draft: dup },
  };
  return homepageBuilderConfigLifecycle.saveDraft(next, actorId);
}

export async function importHomepage(document: HomepageBuilderConfigDocument, actorId: string) {
  const live = await homepageBuilderConfigLifecycle.readLive();
  const imported = importHomepageBundle(
    { draft: document.settings.draft, live: document.settings.production },
    live.settings.draft,
  );
  const next = {
    ...document,
    settings: { ...document.settings, draft: imported },
  };
  return executeHomepageBuilderConfigAction("import-config", actorId, { document: next });
}
