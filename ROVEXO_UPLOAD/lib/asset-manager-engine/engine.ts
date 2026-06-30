import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditAssetManagerEngineAction,
  createAssetManagerEngineAuditEntry,
} from "@/lib/asset-manager-engine/audit";
import {
  createDefaultAssetManagerEngineDocument,
  createDefaultAssetManagerEngineHistory,
} from "@/lib/asset-manager-engine/defaults";
import {
  ASSET_MANAGER_ENGINE_DRAFT_KEY,
  ASSET_MANAGER_ENGINE_HISTORY_KEY,
  ASSET_MANAGER_ENGINE_LIVE_KEY,
} from "@/lib/asset-manager-engine/keys";
import type {
  AssetManagerEngineDocument,
  AssetManagerEngineHistoryEntry,
  EnterpriseAssetRecord,
} from "@/lib/asset-manager-engine/types";

function normalizeDocument(doc: AssetManagerEngineDocument): AssetManagerEngineDocument {
  const defaults = createDefaultAssetManagerEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    libraries: doc.libraries ?? defaults.libraries,
    mediaManager: { ...defaults.mediaManager, ...doc.mediaManager },
    optimization: { ...defaults.optimization, ...doc.optimization },
    validation: { ...defaults.validation, ...doc.validation },
    security: { ...defaults.security, ...doc.security },
    brandKit: { ...defaults.brandKit, ...doc.brandKit },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveAssetManagerEngineDocument(): Promise<AssetManagerEngineDocument> {
  const doc = await getPlatformSetting<AssetManagerEngineDocument>(
    ASSET_MANAGER_ENGINE_LIVE_KEY,
    createDefaultAssetManagerEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getAssetManagerEngineDraft(): Promise<AssetManagerEngineDocument> {
  const live = await readLiveAssetManagerEngineDocument();
  const draft = await getPlatformSetting<AssetManagerEngineDocument>(ASSET_MANAGER_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({
    ...draft,
    label: draft.label === "Live" ? "Draft" : draft.label,
  });
}

export async function getAssetManagerEngineHistory(): Promise<AssetManagerEngineHistoryEntry[]> {
  return getPlatformSetting(ASSET_MANAGER_ENGINE_HISTORY_KEY, createDefaultAssetManagerEngineHistory());
}

export async function getAssetManagerEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getAssetManagerEngineDraft(),
    readLiveAssetManagerEngineDocument(),
    getAssetManagerEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveAssetManagerEngineDraft(
  document: AssetManagerEngineDocument,
  actorId: string,
): Promise<AssetManagerEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createAssetManagerEngineAuditEntry({
        administrator: actorId,
        module: "asset-manager-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({
    actorId,
    key: ASSET_MANAGER_ENGINE_DRAFT_KEY,
    value: next as unknown as Json,
  });
  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function patchAssetManagerEngineDraft(
  patch: Partial<AssetManagerEngineDocument>,
  actorId: string,
): Promise<AssetManagerEngineDocument> {
  const draft = await getAssetManagerEngineDraft();
  return saveAssetManagerEngineDraft({ ...draft, ...patch }, actorId);
}

export async function publishAssetManagerEngine(actorId: string): Promise<AssetManagerEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getAssetManagerEngineDraft(),
    readLiveAssetManagerEngineDocument(),
    getAssetManagerEngineHistory(),
  ]);

  const historyEntry: AssetManagerEngineHistoryEntry = {
    id: `ame-${Date.now()}`,
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
      createAssetManagerEngineAuditEntry({
        administrator: actorId,
        module: "asset-manager-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
        publishReference: historyEntry.id,
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: ASSET_MANAGER_ENGINE_LIVE_KEY,
      value: published as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ASSET_MANAGER_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ASSET_MANAGER_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
    publishReference: historyEntry.id,
  });

  return published;
}

export async function rollbackAssetManagerEngine(
  historyId: string,
  actorId: string,
): Promise<AssetManagerEngineDocument> {
  const history = await getAssetManagerEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Asset Manager Engine rollback entry not found.");

  const restored = normalizeDocument({
    ...entry.bundle,
    label: "Live",
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: ASSET_MANAGER_ENGINE_LIVE_KEY,
      value: restored as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ASSET_MANAGER_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function replaceEnterpriseAsset(
  assetId: string,
  patch: Partial<EnterpriseAssetRecord>,
  actorId: string,
): Promise<void> {
  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager",
    component: assetId,
    action: "replace",
    previousValue: { assetId },
    newValue: patch,
  });
}

export async function archiveEnterpriseAsset(assetId: string, actorId: string): Promise<void> {
  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager",
    component: assetId,
    action: "archive",
    newValue: { status: "archived" },
  });
}

export async function deleteEnterpriseAsset(assetId: string, actorId: string): Promise<void> {
  await auditAssetManagerEngineAction({
    actorId,
    module: "asset-manager",
    component: assetId,
    action: "delete",
    previousValue: { assetId },
    rollbackAvailable: false,
  });
}

export async function resetAssetManagerEngineDraft(actorId: string): Promise<AssetManagerEngineDocument> {
  const live = await readLiveAssetManagerEngineDocument();
  return saveAssetManagerEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function exportAssetManagerEngineDocument(): Promise<AssetManagerEngineDocument> {
  return getAssetManagerEngineDraft();
}

export async function importAssetManagerEngineDocument(
  document: AssetManagerEngineDocument,
  actorId: string,
): Promise<AssetManagerEngineDocument> {
  return saveAssetManagerEngineDraft(document, actorId);
}
