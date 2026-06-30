import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditPlatformStudioAction, createPlatformStudioAuditEntry } from "@/lib/platform-studio/audit";
import {
  createDefaultPlatformStudioDocument,
  createDefaultPlatformStudioHistory,
} from "@/lib/platform-studio/defaults";
import {
  PLATFORM_STUDIO_DRAFT_KEY,
  PLATFORM_STUDIO_HISTORY_KEY,
  PLATFORM_STUDIO_LIVE_KEY,
} from "@/lib/platform-studio/keys";
import { PLATFORM_STUDIO_MODULES } from "@/lib/platform-studio/registry";
import type {
  PlatformStudioDocument,
  PlatformStudioHistoryEntry,
  PlatformStudioSnapshot,
} from "@/lib/platform-studio/types";

function normalizeDocument(doc: PlatformStudioDocument): PlatformStudioDocument {
  return {
    ...createDefaultPlatformStudioDocument(doc.label),
    ...doc,
    forms: doc.forms ?? [],
    workflows: doc.workflows ?? [],
    dashboards: doc.dashboards ?? [],
    automations: doc.automations ?? [],
    roles: doc.roles ?? [],
    fieldConfigs: doc.fieldConfigs ?? [],
    pages: doc.pages ?? [],
    componentRegistry: doc.componentRegistry ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLivePlatformStudioDocument(): Promise<PlatformStudioDocument> {
  const doc = await getPlatformSetting<PlatformStudioDocument>(
    PLATFORM_STUDIO_LIVE_KEY,
    createDefaultPlatformStudioDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getPlatformStudioDraft(): Promise<PlatformStudioDocument> {
  const live = await readLivePlatformStudioDocument();
  const draft = await getPlatformSetting<PlatformStudioDocument>(PLATFORM_STUDIO_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getPlatformStudioHistory(): Promise<PlatformStudioHistoryEntry[]> {
  return getPlatformSetting(PLATFORM_STUDIO_HISTORY_KEY, createDefaultPlatformStudioHistory());
}

export async function getPlatformStudioSnapshot(): Promise<PlatformStudioSnapshot> {
  const [draft, live, history] = await Promise.all([
    getPlatformStudioDraft(),
    readLivePlatformStudioDocument(),
    getPlatformStudioHistory(),
  ]);

  return {
    scannedAt: new Date().toISOString(),
    modules: PLATFORM_STUDIO_MODULES,
    draft,
    live,
    history,
  };
}

export async function savePlatformStudioDraft(
  document: PlatformStudioDocument,
  actorId: string,
): Promise<PlatformStudioDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createPlatformStudioAuditEntry({
        administrator: actorId,
        module: "platform-studio",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: PLATFORM_STUDIO_DRAFT_KEY, value: next as unknown as Json });
  await auditPlatformStudioAction({
    actorId,
    module: "platform-studio",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishPlatformStudio(actorId: string): Promise<PlatformStudioDocument> {
  const [draft, live, history] = await Promise.all([
    getPlatformStudioDraft(),
    readLivePlatformStudioDocument(),
    getPlatformStudioHistory(),
  ]);

  const historyEntry: PlatformStudioHistoryEntry = {
    id: `ps-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({
    ...draft,
    label: "Live",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createPlatformStudioAuditEntry({
        administrator: actorId,
        module: "platform-studio",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PLATFORM_STUDIO_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PLATFORM_STUDIO_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: PLATFORM_STUDIO_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditPlatformStudioAction({
    actorId,
    module: "platform-studio",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackPlatformStudio(historyId: string, actorId: string): Promise<PlatformStudioDocument> {
  const history = await getPlatformStudioHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Platform Studio rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PLATFORM_STUDIO_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PLATFORM_STUDIO_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditPlatformStudioAction({
    actorId,
    module: "platform-studio",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetPlatformStudioDraft(actorId: string): Promise<PlatformStudioDocument> {
  const live = await readLivePlatformStudioDocument();
  return savePlatformStudioDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicatePlatformStudioDraft(actorId: string): Promise<PlatformStudioDocument> {
  const draft = await getPlatformStudioDraft();
  return savePlatformStudioDraft(
    { ...draft, label: `${draft.label} Copy`, version: draft.version + 1 },
    actorId,
  );
}
