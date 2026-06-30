import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditRegistryAction, createRegistryAuditEntry } from "@/lib/enterprise-module-registry-v2/audit";
import { discoverEnterpriseModulesV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { createDefaultRegistryV2Document, normalizeRegistryDocument } from "@/lib/enterprise-module-registry-v2/defaults";
import {
  MODULE_REGISTRY_V2_DRAFT_KEY,
  MODULE_REGISTRY_V2_HISTORY_KEY,
  MODULE_REGISTRY_V2_LIVE_KEY,
} from "@/lib/enterprise-module-registry-v2/keys";
import { validateRegistryModules } from "@/lib/enterprise-module-registry-v2/validation";
import type {
  EnterpriseModuleV2Descriptor,
  RegistryV2Document,
  RegistryV2HistoryBundle,
} from "@/lib/enterprise-module-registry-v2/types";

export async function readLiveRegistryDocument(): Promise<RegistryV2Document> {
  const doc = await getPlatformSetting<RegistryV2Document>(
    MODULE_REGISTRY_V2_LIVE_KEY,
    createDefaultRegistryV2Document("Live"),
  );
  return normalizeRegistryDocument(doc);
}

export async function getRegistryDraft(): Promise<RegistryV2Document> {
  const live = await readLiveRegistryDocument();
  const draft = await getPlatformSetting<RegistryV2Document>(MODULE_REGISTRY_V2_DRAFT_KEY, live);
  return normalizeRegistryDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getRegistryHistory(): Promise<RegistryV2HistoryBundle[]> {
  return getPlatformSetting(MODULE_REGISTRY_V2_HISTORY_KEY, []);
}

export async function saveRegistryDraft(document: RegistryV2Document, actorId: string): Promise<RegistryV2Document> {
  const next = normalizeRegistryDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createRegistryAuditEntry({ action: "save-draft", actorId, newValue: { version: document.version } }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: MODULE_REGISTRY_V2_DRAFT_KEY, value: next as unknown as Json });
  await auditRegistryAction({ actorId, action: "save-draft", newValue: { version: next.version } });
  return next;
}

export async function publishRegistry(actorId: string): Promise<RegistryV2Document> {
  const [draft, live, history] = await Promise.all([getRegistryDraft(), readLiveRegistryDocument(), getRegistryHistory()]);

  const historyEntry: RegistryV2HistoryBundle = {
    id: `emr-hist-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeRegistryDocument({
    ...draft,
    label: "Live",
    updatedAt: new Date().toISOString(),
    modules: discoverEnterpriseModulesV2().map((discovered) => {
      const draftModule = draft.modules.find((m) => m.moduleId === discovered.moduleId);
      return draftModule ? { ...discovered, ...draftModule, updatedAt: new Date().toISOString() } : discovered;
    }),
    auditLog: [
      createRegistryAuditEntry({
        action: "publish",
        actorId,
        previousValue: { version: live.version },
        newValue: { version: draft.version },
        rollbackAvailable: true,
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: MODULE_REGISTRY_V2_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: MODULE_REGISTRY_V2_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MODULE_REGISTRY_V2_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditRegistryAction({
    actorId,
    action: "publish",
    previousValue: { version: live.version },
    newValue: { version: published.version },
  });

  return published;
}

export async function rollbackRegistry(historyId: string, actorId: string): Promise<RegistryV2Document> {
  const history = await getRegistryHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Registry rollback entry not found.");

  const restored = normalizeRegistryDocument({
    ...entry.bundle,
    label: "Live",
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: MODULE_REGISTRY_V2_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: MODULE_REGISTRY_V2_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditRegistryAction({
    actorId,
    action: "rollback",
    previousValue: { historyId },
    newValue: { version: restored.version },
  });

  return restored;
}

export async function registerModuleDescriptor(
  descriptor: EnterpriseModuleV2Descriptor,
  actorId: string,
): Promise<RegistryV2Document> {
  const draft = await getRegistryDraft();
  const validation = validateRegistryModules([descriptor]);
  if (!validation.overallValid) throw new Error(`Module validation failed: ${descriptor.moduleId}`);

  const modules = draft.modules.filter((m) => m.moduleId !== descriptor.moduleId).concat({
    ...descriptor,
    lifecycle: "registered",
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return saveRegistryDraft({ ...draft, modules }, actorId);
}

export async function importRegistryDocument(document: RegistryV2Document, actorId: string): Promise<RegistryV2Document> {
  await auditRegistryAction({ actorId, action: "import", newValue: { version: document.version } });
  return saveRegistryDraft(document, actorId);
}

export async function exportRegistryDocument(): Promise<RegistryV2Document> {
  return readLiveRegistryDocument();
}

export async function validateRegistry(actorId: string) {
  const live = await readLiveRegistryDocument();
  const report = validateRegistryModules(live.modules);
  await auditRegistryAction({ actorId, action: "validate", newValue: { score: report.overallScore } });
  return report;
}

export async function cloneRegistryDraft(actorId: string, label = "Draft clone"): Promise<RegistryV2Document> {
  const draft = await getRegistryDraft();
  const cloned = normalizeRegistryDocument({
    ...draft,
    label: "Draft",
    version: `${draft.version}-clone`,
    updatedAt: new Date().toISOString(),
    snapshots: [
      { id: `snap-${Date.now()}`, label, createdAt: new Date().toISOString(), version: draft.version },
      ...draft.snapshots,
    ].slice(0, 20),
  });
  await auditRegistryAction({ actorId, action: "clone", newValue: { version: cloned.version } });
  return saveRegistryDraft(cloned, actorId);
}

export async function previewRegistry(actorId: string): Promise<RegistryV2Document> {
  const draft = await getRegistryDraft();
  const preview = normalizeRegistryDocument({ ...draft, label: "Preview" });
  await auditRegistryAction({ actorId, action: "preview", newValue: { version: preview.version } });
  return preview;
}

export async function archiveRegistry(actorId: string): Promise<RegistryV2Document> {
  const live = await readLiveRegistryDocument();
  const archived = normalizeRegistryDocument({ ...live, label: "Archived" });
  await auditRegistryAction({ actorId, action: "archive", newValue: { version: archived.version } });
  return saveRegistryDraft(archived, actorId);
}

export async function createRegistrySnapshot(actorId: string, label: string): Promise<RegistryV2Document> {
  const draft = await getRegistryDraft();
  const next = normalizeRegistryDocument({
    ...draft,
    snapshots: [
      { id: `snap-${Date.now()}`, label, createdAt: new Date().toISOString(), version: draft.version },
      ...draft.snapshots,
    ].slice(0, 20),
  });
  await auditRegistryAction({ actorId, action: "snapshot", newValue: { label } });
  return saveRegistryDraft(next, actorId);
}
