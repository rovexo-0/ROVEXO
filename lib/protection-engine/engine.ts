import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditProtectionEngineAction, createProtectionEngineAuditEntry } from "@/lib/protection-engine/audit";
import {
  createDefaultProtectionEngineDocument,
  createDefaultProtectionEngineHistory,
} from "@/lib/protection-engine/defaults";
import {
  PROTECTION_ENGINE_DRAFT_KEY,
  PROTECTION_ENGINE_HISTORY_KEY,
  PROTECTION_ENGINE_LIVE_KEY,
} from "@/lib/protection-engine/keys";
import type { ProtectionEngineDocument, ProtectionEngineHistoryEntry } from "@/lib/protection-engine/types";

function normalizeDocument(doc: ProtectionEngineDocument): ProtectionEngineDocument {
  return {
    ...createDefaultProtectionEngineDocument(doc.label),
    ...doc,
    caseTypes: doc.caseTypes ?? [],
    caseStatuses: doc.caseStatuses ?? [],
    resolutionTypes: doc.resolutionTypes ?? [],
    evidenceTypes: doc.evidenceTypes ?? [],
    filters: doc.filters ?? [],
    notifications: doc.notifications ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveProtectionEngineDocument(): Promise<ProtectionEngineDocument> {
  const doc = await getPlatformSetting<ProtectionEngineDocument>(
    PROTECTION_ENGINE_LIVE_KEY,
    createDefaultProtectionEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getProtectionEngineDraft(): Promise<ProtectionEngineDocument> {
  const live = await readLiveProtectionEngineDocument();
  const draft = await getPlatformSetting<ProtectionEngineDocument>(PROTECTION_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getProtectionEngineHistory(): Promise<ProtectionEngineHistoryEntry[]> {
  return getPlatformSetting(PROTECTION_ENGINE_HISTORY_KEY, createDefaultProtectionEngineHistory());
}

export async function getProtectionEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getProtectionEngineDraft(),
    readLiveProtectionEngineDocument(),
    getProtectionEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveProtectionEngineDraft(
  document: ProtectionEngineDocument,
  actorId: string,
): Promise<ProtectionEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createProtectionEngineAuditEntry({
        administrator: actorId,
        module: "protection-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: PROTECTION_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditProtectionEngineAction({
    actorId,
    module: "protection-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishProtectionEngine(actorId: string): Promise<ProtectionEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getProtectionEngineDraft(),
    readLiveProtectionEngineDocument(),
    getProtectionEngineHistory(),
  ]);

  const historyEntry: ProtectionEngineHistoryEntry = {
    id: `bp-${Date.now()}`,
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
      createProtectionEngineAuditEntry({
        administrator: actorId,
        module: "protection-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PROTECTION_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PROTECTION_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: PROTECTION_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditProtectionEngineAction({
    actorId,
    module: "protection-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackProtectionEngine(historyId: string, actorId: string): Promise<ProtectionEngineDocument> {
  const history = await getProtectionEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Protection Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PROTECTION_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PROTECTION_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditProtectionEngineAction({
    actorId,
    module: "protection-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetProtectionEngineDraft(actorId: string): Promise<ProtectionEngineDocument> {
  const live = await readLiveProtectionEngineDocument();
  return saveProtectionEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateProtectionEngineDraft(actorId: string): Promise<ProtectionEngineDocument> {
  const draft = await getProtectionEngineDraft();
  return saveProtectionEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportProtectionEngineDocument(): Promise<ProtectionEngineDocument> {
  return getProtectionEngineDraft();
}

export async function importProtectionEngineDocument(
  document: ProtectionEngineDocument,
  actorId: string,
): Promise<ProtectionEngineDocument> {
  return saveProtectionEngineDraft(document, actorId);
}
