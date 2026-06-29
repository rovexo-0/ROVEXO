import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditIntegrationsEngineAction,
  createIntegrationsEngineAuditEntry,
} from "@/lib/integrations-engine/audit";
import {
  createDefaultIntegrationsEngineDocument,
  createDefaultIntegrationsEngineHistory,
} from "@/lib/integrations-engine/defaults";
import {
  INTEGRATIONS_ENGINE_DRAFT_KEY,
  INTEGRATIONS_ENGINE_HISTORY_KEY,
  INTEGRATIONS_ENGINE_LIVE_KEY,
} from "@/lib/integrations-engine/keys";
import type {
  IntegrationsEngineDocument,
  IntegrationsEngineHistoryEntry,
} from "@/lib/integrations-engine/types";

function normalizeDocument(doc: IntegrationsEngineDocument): IntegrationsEngineDocument {
  return {
    ...createDefaultIntegrationsEngineDocument(doc.label),
    ...doc,
    modules: doc.modules ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveIntegrationsEngineDocument(): Promise<IntegrationsEngineDocument> {
  const doc = await getPlatformSetting<IntegrationsEngineDocument>(
    INTEGRATIONS_ENGINE_LIVE_KEY,
    createDefaultIntegrationsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getIntegrationsEngineDraft(): Promise<IntegrationsEngineDocument> {
  const live = await readLiveIntegrationsEngineDocument();
  const draft = await getPlatformSetting<IntegrationsEngineDocument>(INTEGRATIONS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getIntegrationsEngineHistory(): Promise<IntegrationsEngineHistoryEntry[]> {
  return getPlatformSetting(INTEGRATIONS_ENGINE_HISTORY_KEY, createDefaultIntegrationsEngineHistory());
}

export async function getIntegrationsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getIntegrationsEngineDraft(),
    readLiveIntegrationsEngineDocument(),
    getIntegrationsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveIntegrationsEngineDraft(
  document: IntegrationsEngineDocument,
  actorId: string,
): Promise<IntegrationsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createIntegrationsEngineAuditEntry({
        administrator: actorId,
        module: "integrations-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: INTEGRATIONS_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditIntegrationsEngineAction({
    actorId,
    module: "integrations-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishIntegrationsEngine(actorId: string): Promise<IntegrationsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getIntegrationsEngineDraft(),
    readLiveIntegrationsEngineDocument(),
    getIntegrationsEngineHistory(),
  ]);

  const historyEntry: IntegrationsEngineHistoryEntry = {
    id: `integ-${Date.now()}`,
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
      createIntegrationsEngineAuditEntry({
        administrator: actorId,
        module: "integrations-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: INTEGRATIONS_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: INTEGRATIONS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: INTEGRATIONS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditIntegrationsEngineAction({
    actorId,
    module: "integrations-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackIntegrationsEngine(
  historyId: string,
  actorId: string,
): Promise<IntegrationsEngineDocument> {
  const history = await getIntegrationsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Integrations Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: INTEGRATIONS_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: INTEGRATIONS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditIntegrationsEngineAction({
    actorId,
    module: "integrations-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetIntegrationsEngineDraft(actorId: string): Promise<IntegrationsEngineDocument> {
  const live = await readLiveIntegrationsEngineDocument();
  return saveIntegrationsEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateIntegrationsEngineDraft(actorId: string): Promise<IntegrationsEngineDocument> {
  const draft = await getIntegrationsEngineDraft();
  return saveIntegrationsEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportIntegrationsEngineDocument(): Promise<IntegrationsEngineDocument> {
  return getIntegrationsEngineDraft();
}

export async function importIntegrationsEngineDocument(
  document: IntegrationsEngineDocument,
  actorId: string,
): Promise<IntegrationsEngineDocument> {
  return saveIntegrationsEngineDraft(document, actorId);
}
