import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditAnalyticsEngineAction,
  createAnalyticsEngineAuditEntry,
} from "@/lib/analytics-engine/audit";
import {
  createDefaultAnalyticsEngineDocument,
  createDefaultAnalyticsEngineHistory,
} from "@/lib/analytics-engine/defaults";
import {
  ANALYTICS_ENGINE_DRAFT_KEY,
  ANALYTICS_ENGINE_HISTORY_KEY,
  ANALYTICS_ENGINE_LIVE_KEY,
} from "@/lib/analytics-engine/keys";
import type { AnalyticsEngineDocument, AnalyticsEngineHistoryEntry } from "@/lib/analytics-engine/types";

function normalizeDocument(doc: AnalyticsEngineDocument): AnalyticsEngineDocument {
  return {
    ...createDefaultAnalyticsEngineDocument(doc.label),
    ...doc,
    modules: doc.modules ?? [],
    liveMetrics: doc.liveMetrics ?? [],
    reportPeriods: doc.reportPeriods ?? [],
    exportFormats: doc.exportFormats ?? [],
    liveCharts: doc.liveCharts ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveAnalyticsEngineDocument(): Promise<AnalyticsEngineDocument> {
  const doc = await getPlatformSetting<AnalyticsEngineDocument>(
    ANALYTICS_ENGINE_LIVE_KEY,
    createDefaultAnalyticsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getAnalyticsEngineDraft(): Promise<AnalyticsEngineDocument> {
  const live = await readLiveAnalyticsEngineDocument();
  const draft = await getPlatformSetting<AnalyticsEngineDocument>(ANALYTICS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getAnalyticsEngineHistory(): Promise<AnalyticsEngineHistoryEntry[]> {
  return getPlatformSetting(ANALYTICS_ENGINE_HISTORY_KEY, createDefaultAnalyticsEngineHistory());
}

export async function getAnalyticsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getAnalyticsEngineDraft(),
    readLiveAnalyticsEngineDocument(),
    getAnalyticsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveAnalyticsEngineDraft(
  document: AnalyticsEngineDocument,
  actorId: string,
): Promise<AnalyticsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createAnalyticsEngineAuditEntry({
        administrator: actorId,
        module: "analytics-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: ANALYTICS_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditAnalyticsEngineAction({
    actorId,
    module: "analytics-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishAnalyticsEngine(actorId: string): Promise<AnalyticsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getAnalyticsEngineDraft(),
    readLiveAnalyticsEngineDocument(),
    getAnalyticsEngineHistory(),
  ]);

  const historyEntry: AnalyticsEngineHistoryEntry = {
    id: `ae-${Date.now()}`,
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
      createAnalyticsEngineAuditEntry({
        administrator: actorId,
        module: "analytics-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ANALYTICS_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ANALYTICS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ANALYTICS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditAnalyticsEngineAction({
    actorId,
    module: "analytics-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackAnalyticsEngine(
  historyId: string,
  actorId: string,
): Promise<AnalyticsEngineDocument> {
  const history = await getAnalyticsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Analytics Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ANALYTICS_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ANALYTICS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditAnalyticsEngineAction({
    actorId,
    module: "analytics-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetAnalyticsEngineDraft(actorId: string): Promise<AnalyticsEngineDocument> {
  const live = await readLiveAnalyticsEngineDocument();
  return saveAnalyticsEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateAnalyticsEngineDraft(actorId: string): Promise<AnalyticsEngineDocument> {
  const draft = await getAnalyticsEngineDraft();
  return saveAnalyticsEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportAnalyticsEngineDocument(): Promise<AnalyticsEngineDocument> {
  return getAnalyticsEngineDraft();
}

export async function importAnalyticsEngineDocument(
  document: AnalyticsEngineDocument,
  actorId: string,
): Promise<AnalyticsEngineDocument> {
  return saveAnalyticsEngineDraft(document, actorId);
}
