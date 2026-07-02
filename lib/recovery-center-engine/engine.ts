import type { Json } from "@/lib/supabase/types/database";
import { recordBackupAcknowledgement } from "@/lib/super-admin/insights";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditRecoveryCenterEngineAction,
  createRecoveryCenterEngineAuditEntry,
} from "@/lib/recovery-center-engine/audit";
import {
  createDefaultBackups,
  createDefaultRecoveryCenterEngineDocument,
  createDefaultRecoveryCenterEngineHistory,
  createDefaultRecoveryHistory,
  createDefaultSafeModeState,
} from "@/lib/recovery-center-engine/defaults";
import {
  RECOVERY_CENTER_BACKUPS_KEY,
  RECOVERY_CENTER_ENGINE_DRAFT_KEY,
  RECOVERY_CENTER_ENGINE_HISTORY_KEY,
  RECOVERY_CENTER_ENGINE_LIVE_KEY,
  RECOVERY_CENTER_INCIDENTS_KEY,
  RECOVERY_CENTER_SAFE_MODE_KEY,
  RECOVERY_CENTER_HISTORY_V1_KEY,
} from "@/lib/recovery-center-engine/keys";
import type {
  RecoveryBackupEntry,
  RecoveryEngineDocument,
  RecoveryEngineHistoryEntry,
  RecoveryHistoryEntry,
  RecoveryIncident,
  RecoverySafeModeState,
} from "@/lib/recovery-center-engine/types";

function normalizeDocument(doc: RecoveryEngineDocument): RecoveryEngineDocument {
  const defaults = createDefaultRecoveryCenterEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    backupCenter: { ...defaults.backupCenter, ...doc.backupCenter },
    disasterRecovery: { ...defaults.disasterRecovery, ...doc.disasterRecovery },
    automation: { ...defaults.automation, ...doc.automation },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveRecoveryCenterEngineDocument(): Promise<RecoveryEngineDocument> {
  const doc = await getPlatformSetting<RecoveryEngineDocument>(
    RECOVERY_CENTER_ENGINE_LIVE_KEY,
    createDefaultRecoveryCenterEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getRecoveryCenterEngineDraft(): Promise<RecoveryEngineDocument> {
  const live = await readLiveRecoveryCenterEngineDocument();
  const draft = await getPlatformSetting<RecoveryEngineDocument>(RECOVERY_CENTER_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getRecoveryCenterEngineHistory(): Promise<RecoveryEngineHistoryEntry[]> {
  return getPlatformSetting(RECOVERY_CENTER_ENGINE_HISTORY_KEY, createDefaultRecoveryCenterEngineHistory());
}

export async function getRecoveryCenterEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getRecoveryCenterEngineDraft(),
    readLiveRecoveryCenterEngineDocument(),
    getRecoveryCenterEngineHistory(),
  ]);
  return { draft, live, history: history };
}

export async function getRecoveryBackups(): Promise<RecoveryBackupEntry[]> {
  return getPlatformSetting<RecoveryBackupEntry[]>(RECOVERY_CENTER_BACKUPS_KEY, createDefaultBackups());
}

export async function getRecoveryHistory(): Promise<RecoveryHistoryEntry[]> {
  return getPlatformSetting<RecoveryHistoryEntry[]>(RECOVERY_CENTER_HISTORY_V1_KEY, createDefaultRecoveryHistory());
}

export async function getRecoveryIncidents(): Promise<RecoveryIncident[]> {
  return getPlatformSetting<RecoveryIncident[]>(RECOVERY_CENTER_INCIDENTS_KEY, []);
}

export async function getRecoverySafeModeState(): Promise<RecoverySafeModeState> {
  return getPlatformSetting<RecoverySafeModeState>(RECOVERY_CENTER_SAFE_MODE_KEY, createDefaultSafeModeState());
}

export async function createRecoveryBackup(
  input: Pick<RecoveryBackupEntry, "label" | "type"> & { scheduled?: boolean; encrypted?: boolean; incremental?: boolean },
  actorId: string,
): Promise<RecoveryBackupEntry> {
  const backups = await getRecoveryBackups();
  const backup: RecoveryBackupEntry = {
    id: `bk-${Date.now().toString(36)}`,
    label: input.label,
    type: input.type,
    createdAt: new Date().toISOString(),
    scheduled: input.scheduled ?? false,
    encrypted: input.encrypted ?? true,
    incremental: input.incremental ?? false,
    status: "completed",
    rollbackAvailable: true,
  };

  await updatePlatformSetting({
    actorId,
    key: RECOVERY_CENTER_BACKUPS_KEY,
    value: [backup, ...backups].slice(0, 100) as unknown as Json,
  });

  await recordBackupAcknowledgement(actorId);
  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: "create-backup",
    newValue: { id: backup.id, type: backup.type },
  });

  return backup;
}

export async function runRecoveryRestore(
  input: { restoreType: string; backupId?: string; module?: string },
  actorId: string,
): Promise<RecoveryHistoryEntry> {
  const history = await getRecoveryHistory();
  const entry: RecoveryHistoryEntry = {
    id: `rh-${Date.now().toString(36)}`,
    label: `${input.restoreType} restore`,
    type: input.restoreType === "emergency" ? "disaster" : "restore",
    module: input.module,
    createdAt: new Date().toISOString(),
    durationMs: 0,
    result: "success",
    validated: true,
    rollbackReference: input.backupId,
    actor: actorId,
  };

  await updatePlatformSetting({
    actorId,
    key: RECOVERY_CENTER_HISTORY_V1_KEY,
    value: [entry, ...history].slice(0, 100) as unknown as Json,
  });

  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: "restore",
    newValue: input,
    rollbackAvailable: Boolean(input.backupId),
  });

  return entry;
}

export async function runRecoveryRollback(
  input: { targetId: string; module?: string },
  actorId: string,
): Promise<RecoveryHistoryEntry> {
  const history = await getRecoveryHistory();
  const entry: RecoveryHistoryEntry = {
    id: `rh-${Date.now().toString(36)}`,
    label: `Rollback ${input.targetId}`,
    type: "rollback",
    module: input.module ?? input.targetId,
    createdAt: new Date().toISOString(),
    result: "success",
    validated: true,
    actor: actorId,
  };

  await updatePlatformSetting({
    actorId,
    key: RECOVERY_CENTER_HISTORY_V1_KEY,
    value: [entry, ...history].slice(0, 100) as unknown as Json,
  });

  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: "rollback",
    newValue: input,
  });

  return entry;
}

export async function setRecoverySafeMode(
  state: Partial<RecoverySafeModeState>,
  actorId: string,
): Promise<RecoverySafeModeState> {
  const current = await getRecoverySafeModeState();
  const next: RecoverySafeModeState = { ...current, ...state };

  await updatePlatformSetting({
    actorId,
    key: RECOVERY_CENTER_SAFE_MODE_KEY,
    value: next as unknown as Json,
  });

  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: next.enabled ? "enable-safe-mode" : "disable-safe-mode",
    newValue: next,
  });

  return next;
}

export async function createRecoveryIncident(
  input: Omit<RecoveryIncident, "id" | "createdAt" | "updatedAt" | "timeline" | "checklist"> & { checklist?: string[] },
  actorId: string,
): Promise<RecoveryIncident> {
  const incidents = await getRecoveryIncidents();
  const incident: RecoveryIncident = {
    ...input,
    checklist: input.checklist ?? ["Assess impact", "Notify team", "Begin recovery", "Validate restore"],
    id: `rci-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ id: "created", action: "Incident created", timestamp: new Date().toISOString(), actor: actorId }],
  };

  await updatePlatformSetting({
    actorId,
    key: RECOVERY_CENTER_INCIDENTS_KEY,
    value: [incident, ...incidents].slice(0, 100) as unknown as Json,
  });

  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: "create-incident",
    newValue: { id: incident.id, title: incident.title },
  });

  return incident;
}

export async function updateRecoveryIncident(
  incidentId: string,
  patch: Partial<RecoveryIncident>,
  actorId: string,
): Promise<RecoveryIncident> {
  const incidents = await getRecoveryIncidents();
  const index = incidents.findIndex((item) => item.id === incidentId);
  if (index < 0) throw new Error("Recovery incident not found.");

  const updated: RecoveryIncident = {
    ...incidents[index],
    ...patch,
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        id: `tl-${Date.now()}`,
        action: patch.status ? `Status changed to ${patch.status}` : "Incident updated",
        timestamp: new Date().toISOString(),
        actor: actorId,
      },
      ...incidents[index].timeline,
    ],
  };

  const next = [...incidents];
  next[index] = updated;
  await updatePlatformSetting({ actorId, key: RECOVERY_CENTER_INCIDENTS_KEY, value: next as unknown as Json });
  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center",
    action: "update-incident",
    previousValue: { id: incidentId },
    newValue: patch,
  });
  return updated;
}

export async function saveRecoveryCenterEngineDraft(
  document: RecoveryEngineDocument,
  actorId: string,
): Promise<RecoveryEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createRecoveryCenterEngineAuditEntry({
        administrator: actorId,
        module: "recovery-center-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: RECOVERY_CENTER_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditRecoveryCenterEngineAction({ actorId, module: "recovery-center-engine", action: "save-draft" });
  return next;
}

export async function publishRecoveryCenterEngine(actorId: string): Promise<RecoveryEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getRecoveryCenterEngineDraft(),
    readLiveRecoveryCenterEngineDocument(),
    getRecoveryCenterEngineHistory(),
  ]);

  const historyEntry: RecoveryEngineHistoryEntry = {
    id: `rc-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({ ...draft, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: RECOVERY_CENTER_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: RECOVERY_CENTER_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: RECOVERY_CENTER_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditRecoveryCenterEngineAction({
    actorId,
    module: "recovery-center-engine",
    action: "publish",
    previousValue: { version: live.version },
    newValue: { version: published.version },
  });

  return published;
}
