import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditSecurityEngineAction,
  createSecurityEngineAuditEntry,
} from "@/lib/security-engine/audit";
import {
  createDefaultSecurityEngineDocument,
  createDefaultSecurityEngineHistory,
} from "@/lib/security-engine/defaults";
import {
  SECURITY_ENGINE_DRAFT_KEY,
  SECURITY_ENGINE_HISTORY_KEY,
  SECURITY_ENGINE_LIVE_KEY,
} from "@/lib/security-engine/keys";
import type { SecurityEngineDocument, SecurityEngineHistoryEntry } from "@/lib/security-engine/types";

function normalizeDocument(doc: SecurityEngineDocument): SecurityEngineDocument {
  return {
    ...createDefaultSecurityEngineDocument(doc.label),
    ...doc,
    modules: doc.modules ?? [],
    authMethods: doc.authMethods ?? [],
    roles: doc.roles ?? [],
    alertLevels: doc.alertLevels ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveSecurityEngineDocument(): Promise<SecurityEngineDocument> {
  const doc = await getPlatformSetting<SecurityEngineDocument>(
    SECURITY_ENGINE_LIVE_KEY,
    createDefaultSecurityEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getSecurityEngineDraft(): Promise<SecurityEngineDocument> {
  const live = await readLiveSecurityEngineDocument();
  const draft = await getPlatformSetting<SecurityEngineDocument>(SECURITY_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getSecurityEngineHistory(): Promise<SecurityEngineHistoryEntry[]> {
  return getPlatformSetting(SECURITY_ENGINE_HISTORY_KEY, createDefaultSecurityEngineHistory());
}

export async function getSecurityEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getSecurityEngineDraft(),
    readLiveSecurityEngineDocument(),
    getSecurityEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveSecurityEngineDraft(
  document: SecurityEngineDocument,
  actorId: string,
): Promise<SecurityEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createSecurityEngineAuditEntry({
        administrator: actorId,
        module: "security-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: SECURITY_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditSecurityEngineAction({
    actorId,
    module: "security-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishSecurityEngine(actorId: string): Promise<SecurityEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getSecurityEngineDraft(),
    readLiveSecurityEngineDocument(),
    getSecurityEngineHistory(),
  ]);

  const historyEntry: SecurityEngineHistoryEntry = {
    id: `sec-${Date.now()}`,
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
      createSecurityEngineAuditEntry({
        administrator: actorId,
        module: "security-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SECURITY_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SECURITY_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: SECURITY_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditSecurityEngineAction({
    actorId,
    module: "security-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackSecurityEngine(historyId: string, actorId: string): Promise<SecurityEngineDocument> {
  const history = await getSecurityEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Security Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SECURITY_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SECURITY_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditSecurityEngineAction({
    actorId,
    module: "security-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetSecurityEngineDraft(actorId: string): Promise<SecurityEngineDocument> {
  const live = await readLiveSecurityEngineDocument();
  return saveSecurityEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateSecurityEngineDraft(actorId: string): Promise<SecurityEngineDocument> {
  const draft = await getSecurityEngineDraft();
  return saveSecurityEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportSecurityEngineDocument(): Promise<SecurityEngineDocument> {
  return getSecurityEngineDraft();
}

export async function importSecurityEngineDocument(
  document: SecurityEngineDocument,
  actorId: string,
): Promise<SecurityEngineDocument> {
  return saveSecurityEngineDraft(document, actorId);
}
