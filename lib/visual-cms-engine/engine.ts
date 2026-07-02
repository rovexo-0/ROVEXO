import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  publishPlatformVisualTheme,
  rollbackPlatformVisualTheme,
  savePlatformVisualDraft,
} from "@/lib/platform-visual/theme-engine";
import { getPlatformVisualDraft } from "@/lib/platform-visual/reader";
import {
  auditVisualCmsEngineAction,
  auditVisualCmsThemeAction,
  createVisualCmsEngineAuditEntry,
} from "@/lib/visual-cms-engine/audit";
import {
  createDefaultVisualCmsEngineDocument,
  createDefaultVisualCmsEngineHistory,
} from "@/lib/visual-cms-engine/defaults";
import {
  VISUAL_CMS_ENGINE_DRAFT_KEY,
  VISUAL_CMS_ENGINE_HISTORY_KEY,
  VISUAL_CMS_ENGINE_LIVE_KEY,
} from "@/lib/visual-cms-engine/keys";
import type {
  VisualCmsEngineDocument,
  VisualCmsEngineHistoryEntry,
  VisualCmsPublishStage,
} from "@/lib/visual-cms-engine/types";

function normalizeDocument(doc: VisualCmsEngineDocument): VisualCmsEngineDocument {
  const defaults = createDefaultVisualCmsEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    builders: doc.builders ?? defaults.builders,
    canvasElements: doc.canvasElements ?? defaults.canvasElements,
    pixelEditor: { ...defaults.pixelEditor, ...doc.pixelEditor },
    componentLibrary: { ...defaults.componentLibrary, ...doc.componentLibrary },
    performance: { ...defaults.performance, ...doc.performance },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    previewBreakpoints: doc.previewBreakpoints ?? defaults.previewBreakpoints,
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveVisualCmsEngineDocument(): Promise<VisualCmsEngineDocument> {
  const doc = await getPlatformSetting<VisualCmsEngineDocument>(
    VISUAL_CMS_ENGINE_LIVE_KEY,
    createDefaultVisualCmsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getVisualCmsEngineDraft(): Promise<VisualCmsEngineDocument> {
  const live = await readLiveVisualCmsEngineDocument();
  const draft = await getPlatformSetting<VisualCmsEngineDocument>(VISUAL_CMS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({
    ...draft,
    label: draft.label === "Live" ? "Draft" : draft.label,
  });
}

export async function getVisualCmsEngineHistory(): Promise<VisualCmsEngineHistoryEntry[]> {
  return getPlatformSetting(VISUAL_CMS_ENGINE_HISTORY_KEY, createDefaultVisualCmsEngineHistory());
}

export async function getVisualCmsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getVisualCmsEngineDraft(),
    readLiveVisualCmsEngineDocument(),
    getVisualCmsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveVisualCmsEngineDraft(
  document: VisualCmsEngineDocument,
  actorId: string,
): Promise<VisualCmsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createVisualCmsEngineAuditEntry({
        administrator: actorId,
        module: "visual-cms-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({
    actorId,
    key: VISUAL_CMS_ENGINE_DRAFT_KEY,
    value: next as unknown as Json,
  });
  await auditVisualCmsEngineAction({
    actorId,
    module: "visual-cms-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function patchVisualCmsEngineDraft(
  patch: Partial<VisualCmsEngineDocument>,
  actorId: string,
): Promise<VisualCmsEngineDocument> {
  const draft = await getVisualCmsEngineDraft();
  return saveVisualCmsEngineDraft({ ...draft, ...patch }, actorId);
}

export async function setVisualCmsPublishStage(
  stage: VisualCmsPublishStage,
  actorId: string,
): Promise<VisualCmsEngineDocument> {
  return patchVisualCmsEngineDraft({ publishStage: stage }, actorId);
}

export async function publishVisualCmsEngine(actorId: string): Promise<VisualCmsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getVisualCmsEngineDraft(),
    readLiveVisualCmsEngineDocument(),
    getVisualCmsEngineHistory(),
  ]);

  const historyEntry: VisualCmsEngineHistoryEntry = {
    id: `vcms-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({
    ...draft,
    label: "Live",
    publishStage: "published",
    activeThemeLabel: "Live",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createVisualCmsEngineAuditEntry({
        administrator: actorId,
        module: "visual-cms-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
        publishReference: historyEntry.id,
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: VISUAL_CMS_ENGINE_LIVE_KEY,
      value: published as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: VISUAL_CMS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft", publishStage: "draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: VISUAL_CMS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditVisualCmsEngineAction({
    actorId,
    module: "visual-cms-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
    publishReference: historyEntry.id,
  });

  return published;
}

export async function rollbackVisualCmsEngine(
  historyId: string,
  actorId: string,
): Promise<VisualCmsEngineDocument> {
  const history = await getVisualCmsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Visual CMS Engine rollback entry not found.");

  const restored = normalizeDocument({
    ...entry.bundle,
    label: "Live",
    publishStage: "published",
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: VISUAL_CMS_ENGINE_LIVE_KEY,
      value: restored as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: VISUAL_CMS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft", publishStage: "draft" } as unknown as Json,
    }),
  ]);

  await auditVisualCmsEngineAction({
    actorId,
    module: "visual-cms-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function publishVisualCmsTheme(actorId: string) {
  await setVisualCmsPublishStage("approve", actorId);
  const visualBundle = await publishPlatformVisualTheme(actorId);
  const cmsDoc = await patchVisualCmsEngineDraft(
    {
      publishStage: "published",
      activeThemeLabel: visualBundle.label,
      updatedAt: new Date().toISOString(),
    },
    actorId,
  );
  await auditVisualCmsThemeAction({
    actorId,
    action: "publish-theme",
    newValue: { label: visualBundle.label, version: visualBundle.version },
    rollbackAvailable: true,
  });
  return { visualBundle, cmsDoc };
}

export async function rollbackVisualCmsTheme(historyId: string, actorId: string) {
  const visualBundle = await rollbackPlatformVisualTheme(historyId, actorId);
  const cmsDoc = await patchVisualCmsEngineDraft(
    { publishStage: "published", activeThemeLabel: visualBundle.label },
    actorId,
  );
  await auditVisualCmsThemeAction({
    actorId,
    action: "rollback-theme",
    previousValue: { historyId },
    newValue: { label: visualBundle.label, version: visualBundle.version },
    rollbackAvailable: false,
  });
  return { visualBundle, cmsDoc };
}

export async function resetVisualCmsEngineDraft(actorId: string): Promise<VisualCmsEngineDocument> {
  const live = await readLiveVisualCmsEngineDocument();
  return saveVisualCmsEngineDraft({ ...live, label: "Draft", publishStage: "draft" }, actorId);
}

export async function exportVisualCmsEngineDocument(): Promise<VisualCmsEngineDocument> {
  return getVisualCmsEngineDraft();
}

export async function importVisualCmsEngineDocument(
  document: VisualCmsEngineDocument,
  actorId: string,
): Promise<VisualCmsEngineDocument> {
  return saveVisualCmsEngineDraft(document, actorId);
}

export async function syncVisualBundleDraft(actorId: string) {
  const bundle = await getPlatformVisualDraft();
  return savePlatformVisualDraft(bundle, actorId);
}
