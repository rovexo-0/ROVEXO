import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditAppStudioAction, createAppStudioAuditEntry } from "@/lib/app-studio/audit";
import { createDefaultAppStudioDocument, createDefaultAppStudioHistory } from "@/lib/app-studio/defaults";
import { APP_STUDIO_DRAFT_KEY, APP_STUDIO_HISTORY_KEY, APP_STUDIO_LIVE_KEY } from "@/lib/app-studio/keys";
import type { AppStudioDocument, AppStudioHistoryEntry } from "@/lib/app-studio/types";

function normalizeDocument(doc: AppStudioDocument): AppStudioDocument {
  return {
    ...createDefaultAppStudioDocument(doc.label),
    ...doc,
    customModules: doc.customModules ?? [],
    pages: doc.pages ?? [],
    navigation: doc.navigation ?? createDefaultAppStudioDocument().navigation,
    automations: doc.automations ?? [],
    security: doc.security ?? createDefaultAppStudioDocument().security,
    plugins: doc.plugins ?? [],
    recoveryPoints: doc.recoveryPoints ?? [],
    notificationAlerts: doc.notificationAlerts ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveAppStudioDocument(): Promise<AppStudioDocument> {
  const doc = await getPlatformSetting<AppStudioDocument>(APP_STUDIO_LIVE_KEY, createDefaultAppStudioDocument("Live"));
  return normalizeDocument(doc);
}

export async function getAppStudioDraft(): Promise<AppStudioDocument> {
  const live = await readLiveAppStudioDocument();
  const draft = await getPlatformSetting<AppStudioDocument>(APP_STUDIO_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getAppStudioHistory(): Promise<AppStudioHistoryEntry[]> {
  return getPlatformSetting(APP_STUDIO_HISTORY_KEY, createDefaultAppStudioHistory());
}

export async function saveAppStudioDraft(document: AppStudioDocument, actorId: string): Promise<AppStudioDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createAppStudioAuditEntry({
        administrator: actorId,
        module: "app-studio",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: APP_STUDIO_DRAFT_KEY, value: next as unknown as Json });
  await auditAppStudioAction({
    actorId,
    module: "app-studio",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishAppStudio(actorId: string): Promise<AppStudioDocument> {
  const [draft, live, history] = await Promise.all([
    getAppStudioDraft(),
    readLiveAppStudioDocument(),
    getAppStudioHistory(),
  ]);

  const historyEntry: AppStudioHistoryEntry = {
    id: `as-${Date.now()}`,
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
      createAppStudioAuditEntry({
        administrator: actorId,
        module: "app-studio",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: APP_STUDIO_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: APP_STUDIO_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: APP_STUDIO_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditAppStudioAction({
    actorId,
    module: "app-studio",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackAppStudio(historyId: string, actorId: string): Promise<AppStudioDocument> {
  const history = await getAppStudioHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("App Studio rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: APP_STUDIO_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: APP_STUDIO_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditAppStudioAction({
    actorId,
    module: "app-studio",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetAppStudioDraft(actorId: string): Promise<AppStudioDocument> {
  const live = await readLiveAppStudioDocument();
  return saveAppStudioDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateAppStudioDraft(actorId: string): Promise<AppStudioDocument> {
  const draft = await getAppStudioDraft();
  return saveAppStudioDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function importAppStudioDocument(document: AppStudioDocument, actorId: string): Promise<AppStudioDocument> {
  return saveAppStudioDraft(document, actorId);
}

export async function exportAppStudioDocument(): Promise<AppStudioDocument> {
  return getAppStudioDraft();
}
