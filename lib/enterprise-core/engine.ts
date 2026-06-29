import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditEnterpriseCoreAction, createEnterpriseCoreAuditEntry } from "@/lib/enterprise-core/audit";
import {
  createDefaultEnterpriseCoreDocument,
  createDefaultEnterpriseCoreHistory,
} from "@/lib/enterprise-core/defaults";
import {
  ENTERPRISE_CORE_DRAFT_KEY,
  ENTERPRISE_CORE_HISTORY_KEY,
  ENTERPRISE_CORE_LIVE_KEY,
} from "@/lib/enterprise-core/keys";
import type { EnterpriseCoreDocument, EnterpriseCoreHistoryEntry } from "@/lib/enterprise-core/types";

function normalizeDocument(doc: EnterpriseCoreDocument): EnterpriseCoreDocument {
  return {
    ...createDefaultEnterpriseCoreDocument(doc.label),
    ...doc,
    notifications: doc.notifications ?? [],
    backups: doc.backups ?? [],
    roles: doc.roles ?? [],
    updates: doc.updates ?? [],
    recoveryHistory: doc.recoveryHistory ?? [],
    aiAssistant: doc.aiAssistant ?? createDefaultEnterpriseCoreDocument().aiAssistant,
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveEnterpriseCoreDocument(): Promise<EnterpriseCoreDocument> {
  const doc = await getPlatformSetting<EnterpriseCoreDocument>(
    ENTERPRISE_CORE_LIVE_KEY,
    createDefaultEnterpriseCoreDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getEnterpriseCoreDraft(): Promise<EnterpriseCoreDocument> {
  const live = await readLiveEnterpriseCoreDocument();
  const draft = await getPlatformSetting<EnterpriseCoreDocument>(ENTERPRISE_CORE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getEnterpriseCoreHistory(): Promise<EnterpriseCoreHistoryEntry[]> {
  return getPlatformSetting(ENTERPRISE_CORE_HISTORY_KEY, createDefaultEnterpriseCoreHistory());
}

export async function saveEnterpriseCoreDraft(
  document: EnterpriseCoreDocument,
  actorId: string,
): Promise<EnterpriseCoreDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createEnterpriseCoreAuditEntry({
        administrator: actorId,
        module: "enterprise-core",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: ENTERPRISE_CORE_DRAFT_KEY, value: next as unknown as Json });
  await auditEnterpriseCoreAction({
    actorId,
    module: "enterprise-core",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishEnterpriseCore(actorId: string): Promise<EnterpriseCoreDocument> {
  const [draft, live, history] = await Promise.all([
    getEnterpriseCoreDraft(),
    readLiveEnterpriseCoreDocument(),
    getEnterpriseCoreHistory(),
  ]);

  const historyEntry: EnterpriseCoreHistoryEntry = {
    id: `ec-${Date.now()}`,
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
      createEnterpriseCoreAuditEntry({
        administrator: actorId,
        module: "enterprise-core",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ENTERPRISE_CORE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ENTERPRISE_CORE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ENTERPRISE_CORE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditEnterpriseCoreAction({
    actorId,
    module: "enterprise-core",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackEnterpriseCore(historyId: string, actorId: string): Promise<EnterpriseCoreDocument> {
  const history = await getEnterpriseCoreHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Enterprise Core rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ENTERPRISE_CORE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ENTERPRISE_CORE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditEnterpriseCoreAction({
    actorId,
    module: "enterprise-core",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetEnterpriseCoreDraft(actorId: string): Promise<EnterpriseCoreDocument> {
  const live = await readLiveEnterpriseCoreDocument();
  return saveEnterpriseCoreDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateEnterpriseCoreDraft(actorId: string): Promise<EnterpriseCoreDocument> {
  const draft = await getEnterpriseCoreDraft();
  return saveEnterpriseCoreDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportEnterpriseCoreDocument(): Promise<EnterpriseCoreDocument> {
  return getEnterpriseCoreDraft();
}

export async function importEnterpriseCoreDocument(
  document: EnterpriseCoreDocument,
  actorId: string,
): Promise<EnterpriseCoreDocument> {
  return saveEnterpriseCoreDraft(document, actorId);
}
