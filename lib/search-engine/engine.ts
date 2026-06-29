import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditSearchEngineAction,
  createSearchEngineAuditEntry,
} from "@/lib/search-engine/audit";
import {
  createDefaultSearchEngineDocument,
  createDefaultSearchEngineHistory,
} from "@/lib/search-engine/defaults";
import {
  SEARCH_ENGINE_DRAFT_KEY,
  SEARCH_ENGINE_HISTORY_KEY,
  SEARCH_ENGINE_LIVE_KEY,
} from "@/lib/search-engine/keys";
import type { SearchEngineDocument, SearchEngineHistoryEntry } from "@/lib/search-engine/types";

function normalizeDocument(doc: SearchEngineDocument): SearchEngineDocument {
  return {
    ...createDefaultSearchEngineDocument(doc.label),
    ...doc,
    modules: doc.modules ?? [],
    searchTypes: doc.searchTypes ?? [],
    sortOptions: doc.sortOptions ?? [],
    indexes: doc.indexes ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveSearchEngineDocument(): Promise<SearchEngineDocument> {
  const doc = await getPlatformSetting<SearchEngineDocument>(
    SEARCH_ENGINE_LIVE_KEY,
    createDefaultSearchEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getSearchEngineDraft(): Promise<SearchEngineDocument> {
  const live = await readLiveSearchEngineDocument();
  const draft = await getPlatformSetting<SearchEngineDocument>(SEARCH_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getSearchEngineHistory(): Promise<SearchEngineHistoryEntry[]> {
  return getPlatformSetting(SEARCH_ENGINE_HISTORY_KEY, createDefaultSearchEngineHistory());
}

export async function getSearchEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getSearchEngineDraft(),
    readLiveSearchEngineDocument(),
    getSearchEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveSearchEngineDraft(
  document: SearchEngineDocument,
  actorId: string,
): Promise<SearchEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createSearchEngineAuditEntry({
        administrator: actorId,
        module: "search-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: SEARCH_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditSearchEngineAction({
    actorId,
    module: "search-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishSearchEngine(actorId: string): Promise<SearchEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getSearchEngineDraft(),
    readLiveSearchEngineDocument(),
    getSearchEngineHistory(),
  ]);

  const historyEntry: SearchEngineHistoryEntry = {
    id: `srch-${Date.now()}`,
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
      createSearchEngineAuditEntry({
        administrator: actorId,
        module: "search-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SEARCH_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SEARCH_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: SEARCH_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditSearchEngineAction({
    actorId,
    module: "search-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackSearchEngine(historyId: string, actorId: string): Promise<SearchEngineDocument> {
  const history = await getSearchEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Search Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SEARCH_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SEARCH_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditSearchEngineAction({
    actorId,
    module: "search-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetSearchEngineDraft(actorId: string): Promise<SearchEngineDocument> {
  const live = await readLiveSearchEngineDocument();
  return saveSearchEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateSearchEngineDraft(actorId: string): Promise<SearchEngineDocument> {
  const draft = await getSearchEngineDraft();
  return saveSearchEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportSearchEngineDocument(): Promise<SearchEngineDocument> {
  return getSearchEngineDraft();
}

export async function importSearchEngineDocument(
  document: SearchEngineDocument,
  actorId: string,
): Promise<SearchEngineDocument> {
  return saveSearchEngineDraft(document, actorId);
}
