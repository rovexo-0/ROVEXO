import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditNotificationsEngineAction,
  createNotificationsEngineAuditEntry,
} from "@/lib/notifications-engine/audit";
import {
  createDefaultNotificationsEngineDocument,
  createDefaultNotificationsEngineHistory,
} from "@/lib/notifications-engine/defaults";
import {
  NOTIFICATIONS_ENGINE_DRAFT_KEY,
  NOTIFICATIONS_ENGINE_HISTORY_KEY,
  NOTIFICATIONS_ENGINE_LIVE_KEY,
} from "@/lib/notifications-engine/keys";
import type { NotificationsEngineDocument, NotificationsEngineHistoryEntry } from "@/lib/notifications-engine/types";

function normalizeDocument(doc: NotificationsEngineDocument): NotificationsEngineDocument {
  return {
    ...createDefaultNotificationsEngineDocument(doc.label),
    ...doc,
    notificationTypes: doc.notificationTypes ?? [],
    channels: doc.channels ?? [],
    priorities: doc.priorities ?? [],
    events: doc.events ?? [],
    filters: doc.filters ?? [],
    templates: doc.templates ?? [],
    badgeSurfaces: doc.badgeSurfaces ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveNotificationsEngineDocument(): Promise<NotificationsEngineDocument> {
  const doc = await getPlatformSetting<NotificationsEngineDocument>(
    NOTIFICATIONS_ENGINE_LIVE_KEY,
    createDefaultNotificationsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getNotificationsEngineDraft(): Promise<NotificationsEngineDocument> {
  const live = await readLiveNotificationsEngineDocument();
  const draft = await getPlatformSetting<NotificationsEngineDocument>(NOTIFICATIONS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getNotificationsEngineHistory(): Promise<NotificationsEngineHistoryEntry[]> {
  return getPlatformSetting(NOTIFICATIONS_ENGINE_HISTORY_KEY, createDefaultNotificationsEngineHistory());
}

export async function getNotificationsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getNotificationsEngineDraft(),
    readLiveNotificationsEngineDocument(),
    getNotificationsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveNotificationsEngineDraft(
  document: NotificationsEngineDocument,
  actorId: string,
): Promise<NotificationsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createNotificationsEngineAuditEntry({
        administrator: actorId,
        module: "notifications-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: NOTIFICATIONS_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditNotificationsEngineAction({
    actorId,
    module: "notifications-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishNotificationsEngine(actorId: string): Promise<NotificationsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getNotificationsEngineDraft(),
    readLiveNotificationsEngineDocument(),
    getNotificationsEngineHistory(),
  ]);

  const historyEntry: NotificationsEngineHistoryEntry = {
    id: `ne-${Date.now()}`,
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
      createNotificationsEngineAuditEntry({
        administrator: actorId,
        module: "notifications-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: NOTIFICATIONS_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: NOTIFICATIONS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: NOTIFICATIONS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditNotificationsEngineAction({
    actorId,
    module: "notifications-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackNotificationsEngine(
  historyId: string,
  actorId: string,
): Promise<NotificationsEngineDocument> {
  const history = await getNotificationsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Notifications Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: NOTIFICATIONS_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: NOTIFICATIONS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditNotificationsEngineAction({
    actorId,
    module: "notifications-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetNotificationsEngineDraft(actorId: string): Promise<NotificationsEngineDocument> {
  const live = await readLiveNotificationsEngineDocument();
  return saveNotificationsEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateNotificationsEngineDraft(actorId: string): Promise<NotificationsEngineDocument> {
  const draft = await getNotificationsEngineDraft();
  return saveNotificationsEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportNotificationsEngineDocument(): Promise<NotificationsEngineDocument> {
  return getNotificationsEngineDraft();
}

export async function importNotificationsEngineDocument(
  document: NotificationsEngineDocument,
  actorId: string,
): Promise<NotificationsEngineDocument> {
  return saveNotificationsEngineDraft(document, actorId);
}
