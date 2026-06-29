import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditAiEngineAction, createAiEngineAuditEntry } from "@/lib/ai-engine/audit";
import {
  createDefaultAiEngineDocument,
  createDefaultAiEngineHistory,
} from "@/lib/ai-engine/defaults";
import {
  AI_ENGINE_DRAFT_KEY,
  AI_ENGINE_HISTORY_KEY,
  AI_ENGINE_LIVE_KEY,
} from "@/lib/ai-engine/keys";
import type { AiEngineDocument, AiEngineHistoryEntry } from "@/lib/ai-engine/types";

function normalizeDocument(doc: AiEngineDocument): AiEngineDocument {
  return {
    ...createDefaultAiEngineDocument(doc.label),
    ...doc,
    modules: doc.modules ?? [],
    providers: doc.providers ?? [],
    permissions: doc.permissions ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveAiEngineDocument(): Promise<AiEngineDocument> {
  const doc = await getPlatformSetting<AiEngineDocument>(
    AI_ENGINE_LIVE_KEY,
    createDefaultAiEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getAiEngineDraft(): Promise<AiEngineDocument> {
  const live = await readLiveAiEngineDocument();
  const draft = await getPlatformSetting<AiEngineDocument>(AI_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getAiEngineHistory(): Promise<AiEngineHistoryEntry[]> {
  return getPlatformSetting(AI_ENGINE_HISTORY_KEY, createDefaultAiEngineHistory());
}

export async function getAiEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getAiEngineDraft(),
    readLiveAiEngineDocument(),
    getAiEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveAiEngineDraft(
  document: AiEngineDocument,
  actorId: string,
): Promise<AiEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createAiEngineAuditEntry({
        administrator: actorId,
        module: "ai-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: AI_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditAiEngineAction({
    actorId,
    module: "ai-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishAiEngine(actorId: string): Promise<AiEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getAiEngineDraft(),
    readLiveAiEngineDocument(),
    getAiEngineHistory(),
  ]);

  const historyEntry: AiEngineHistoryEntry = {
    id: `aie-${Date.now()}`,
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
      createAiEngineAuditEntry({
        administrator: actorId,
        module: "ai-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: AI_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: AI_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: AI_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditAiEngineAction({
    actorId,
    module: "ai-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackAiEngine(historyId: string, actorId: string): Promise<AiEngineDocument> {
  const history = await getAiEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("AI Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: AI_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: AI_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditAiEngineAction({
    actorId,
    module: "ai-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetAiEngineDraft(actorId: string): Promise<AiEngineDocument> {
  const live = await readLiveAiEngineDocument();
  return saveAiEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateAiEngineDraft(actorId: string): Promise<AiEngineDocument> {
  const draft = await getAiEngineDraft();
  return saveAiEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportAiEngineDocument(): Promise<AiEngineDocument> {
  return getAiEngineDraft();
}

export async function importAiEngineDocument(
  document: AiEngineDocument,
  actorId: string,
): Promise<AiEngineDocument> {
  return saveAiEngineDraft(document, actorId);
}
