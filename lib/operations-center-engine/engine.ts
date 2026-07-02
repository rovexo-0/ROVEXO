import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditOperationsCenterEngineAction,
  createOperationsEngineAuditEntry,
} from "@/lib/operations-center-engine/audit";
import {
  createDefaultMaintenanceState,
  createDefaultOperationsEngineDocument,
  createDefaultOperationsEngineHistory,
} from "@/lib/operations-center-engine/defaults";
import {
  OPERATIONS_CENTER_ENGINE_DRAFT_KEY,
  OPERATIONS_CENTER_ENGINE_HISTORY_KEY,
  OPERATIONS_CENTER_ENGINE_LIVE_KEY,
  OPERATIONS_CENTER_INCIDENTS_KEY,
  OPERATIONS_CENTER_MAINTENANCE_KEY,
} from "@/lib/operations-center-engine/keys";
import type {
  OperationsEngineDocument,
  OperationsEngineHistoryEntry,
  OperationsIncident,
  OperationsMaintenanceState,
} from "@/lib/operations-center-engine/types";

function normalizeDocument(doc: OperationsEngineDocument): OperationsEngineDocument {
  const defaults = createDefaultOperationsEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    monitoring: { ...defaults.monitoring, ...doc.monitoring },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveOperationsEngineDocument(): Promise<OperationsEngineDocument> {
  const doc = await getPlatformSetting<OperationsEngineDocument>(
    OPERATIONS_CENTER_ENGINE_LIVE_KEY,
    createDefaultOperationsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getOperationsEngineDraft(): Promise<OperationsEngineDocument> {
  const live = await readLiveOperationsEngineDocument();
  const draft = await getPlatformSetting<OperationsEngineDocument>(OPERATIONS_CENTER_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getOperationsEngineHistory(): Promise<OperationsEngineHistoryEntry[]> {
  return getPlatformSetting(OPERATIONS_CENTER_ENGINE_HISTORY_KEY, createDefaultOperationsEngineHistory());
}

export async function getOperationsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getOperationsEngineDraft(),
    readLiveOperationsEngineDocument(),
    getOperationsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function getOperationsIncidents(): Promise<OperationsIncident[]> {
  return getPlatformSetting<OperationsIncident[]>(OPERATIONS_CENTER_INCIDENTS_KEY, []);
}

export async function getOperationsMaintenanceState(): Promise<OperationsMaintenanceState> {
  const platformMaintenance = await getPlatformSetting<{ enabled?: boolean; message?: string }>(
    "maintenance_mode",
    { enabled: false, message: "" },
  );
  const opsMaintenance = await getPlatformSetting<OperationsMaintenanceState>(
    OPERATIONS_CENTER_MAINTENANCE_KEY,
    createDefaultMaintenanceState(),
  );
  return {
    ...opsMaintenance,
    enabled: platformMaintenance.enabled ?? opsMaintenance.enabled,
    message: platformMaintenance.message ?? opsMaintenance.message,
  };
}

export async function saveOperationsEngineDraft(
  document: OperationsEngineDocument,
  actorId: string,
): Promise<OperationsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createOperationsEngineAuditEntry({
        administrator: actorId,
        module: "operations-center-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: OPERATIONS_CENTER_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditOperationsCenterEngineAction({ actorId, module: "operations-center-engine", action: "save-draft" });
  return next;
}

export async function publishOperationsEngine(actorId: string): Promise<OperationsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getOperationsEngineDraft(),
    readLiveOperationsEngineDocument(),
    getOperationsEngineHistory(),
  ]);

  const historyEntry: OperationsEngineHistoryEntry = {
    id: `ops-${Date.now()}`,
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
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: OPERATIONS_CENTER_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: OPERATIONS_CENTER_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: OPERATIONS_CENTER_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center-engine",
    action: "publish",
    previousValue: { version: live.version },
    newValue: { version: published.version },
  });

  return published;
}

export async function rollbackOperationsEngine(
  historyId: string,
  actorId: string,
): Promise<OperationsEngineDocument> {
  const history = await getOperationsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Operations Center rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: OPERATIONS_CENTER_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: OPERATIONS_CENTER_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label },
  });

  return restored;
}

export async function createOperationsIncident(
  input: Omit<OperationsIncident, "id" | "createdAt" | "updatedAt" | "timeline">,
  actorId: string,
): Promise<OperationsIncident> {
  const incidents = await getOperationsIncidents();
  const incident: OperationsIncident = {
    ...input,
    id: `inc-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ id: "created", action: "Incident created", timestamp: new Date().toISOString(), actor: actorId }],
  };
  await updatePlatformSetting({
    actorId,
    key: OPERATIONS_CENTER_INCIDENTS_KEY,
    value: [incident, ...incidents].slice(0, 100) as unknown as Json,
  });
  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center",
    action: "create-incident",
    newValue: { id: incident.id, title: incident.title },
  });
  return incident;
}

export async function updateOperationsIncident(
  incidentId: string,
  patch: Partial<OperationsIncident>,
  actorId: string,
): Promise<OperationsIncident> {
  const incidents = await getOperationsIncidents();
  const index = incidents.findIndex((item) => item.id === incidentId);
  if (index < 0) throw new Error("Incident not found.");

  const updated: OperationsIncident = {
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
  await updatePlatformSetting({ actorId, key: OPERATIONS_CENTER_INCIDENTS_KEY, value: next as unknown as Json });
  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center",
    action: "update-incident",
    previousValue: { id: incidentId },
    newValue: patch,
  });
  return updated;
}

export async function setOperationsMaintenance(
  state: Partial<OperationsMaintenanceState>,
  actorId: string,
): Promise<OperationsMaintenanceState> {
  const current = await getOperationsMaintenanceState();
  const next: OperationsMaintenanceState = {
    ...current,
    ...state,
    mode: state.enabled ? (state.mode ?? "scheduled") : "disabled",
  };

  await Promise.all([
    updatePlatformSetting({ actorId, key: OPERATIONS_CENTER_MAINTENANCE_KEY, value: next as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: "maintenance_mode",
      value: { enabled: next.enabled, message: next.message } as Json,
    }),
  ]);

  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center",
    action: next.enabled ? "enable-maintenance" : "disable-maintenance",
    newValue: next,
  });

  return next;
}

export async function runOperationsRecoveryAction(actionId: string, actorId: string): Promise<void> {
  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center",
    action: "recovery",
    newValue: { actionId },
    rollbackAvailable: false,
  });
}

export async function runOperationsAutomatedAction(actionId: string, actorId: string): Promise<void> {
  await auditOperationsCenterEngineAction({
    actorId,
    module: "operations-center",
    action: "automated-action",
    newValue: { actionId },
  });
}
