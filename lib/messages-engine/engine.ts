import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditMessagesEngineAction, createMessagesEngineAuditEntry } from "@/lib/messages-engine/audit";
import {
  createDefaultMessagesEngineDocument,
  createDefaultMessagesEngineHistory,
} from "@/lib/messages-engine/defaults";
import {
  MESSAGES_ENGINE_DRAFT_KEY,
  MESSAGES_ENGINE_HISTORY_KEY,
  MESSAGES_ENGINE_LIVE_KEY,
} from "@/lib/messages-engine/keys";
import type { MessagesEngineDocument, MessagesEngineHistoryEntry } from "@/lib/messages-engine/types";

function normalizeDocument(doc: MessagesEngineDocument): MessagesEngineDocument {
  return {
    ...createDefaultMessagesEngineDocument(doc.label),
    ...doc,
    conversationTypes: doc.conversationTypes ?? [],
    messageTypes: doc.messageTypes ?? [],
    conversationStatuses: doc.conversationStatuses ?? [],
    messageStatuses: doc.messageStatuses ?? [],
    filters: doc.filters ?? [],
    searchScopes: doc.searchScopes ?? [],
    notifications: doc.notifications ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveMessagesEngineDocument(): Promise<MessagesEngineDocument> {
  const doc = await getPlatformSetting<MessagesEngineDocument>(
    MESSAGES_ENGINE_LIVE_KEY,
    createDefaultMessagesEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getMessagesEngineDraft(): Promise<MessagesEngineDocument> {
  const live = await readLiveMessagesEngineDocument();
  const draft = await getPlatformSetting<MessagesEngineDocument>(MESSAGES_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getMessagesEngineHistory(): Promise<MessagesEngineHistoryEntry[]> {
  return getPlatformSetting(MESSAGES_ENGINE_HISTORY_KEY, createDefaultMessagesEngineHistory());
}

export async function getMessagesEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getMessagesEngineDraft(),
    readLiveMessagesEngineDocument(),
    getMessagesEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveMessagesEngineDraft(
  document: MessagesEngineDocument,
  actorId: string,
): Promise<MessagesEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createMessagesEngineAuditEntry({
        administrator: actorId,
        module: "messages-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: MESSAGES_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditMessagesEngineAction({
    actorId,
    module: "messages-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishMessagesEngine(actorId: string): Promise<MessagesEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getMessagesEngineDraft(),
    readLiveMessagesEngineDocument(),
    getMessagesEngineHistory(),
  ]);

  const historyEntry: MessagesEngineHistoryEntry = {
    id: `me-${Date.now()}`,
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
      createMessagesEngineAuditEntry({
        administrator: actorId,
        module: "messages-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: MESSAGES_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: MESSAGES_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MESSAGES_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditMessagesEngineAction({
    actorId,
    module: "messages-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackMessagesEngine(historyId: string, actorId: string): Promise<MessagesEngineDocument> {
  const history = await getMessagesEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Messages Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: MESSAGES_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: MESSAGES_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditMessagesEngineAction({
    actorId,
    module: "messages-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetMessagesEngineDraft(actorId: string): Promise<MessagesEngineDocument> {
  const live = await readLiveMessagesEngineDocument();
  return saveMessagesEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateMessagesEngineDraft(actorId: string): Promise<MessagesEngineDocument> {
  const draft = await getMessagesEngineDraft();
  return saveMessagesEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportMessagesEngineDocument(): Promise<MessagesEngineDocument> {
  return getMessagesEngineDraft();
}

export async function importMessagesEngineDocument(
  document: MessagesEngineDocument,
  actorId: string,
): Promise<MessagesEngineDocument> {
  return saveMessagesEngineDraft(document, actorId);
}
