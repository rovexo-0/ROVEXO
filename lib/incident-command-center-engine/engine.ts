import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditIncidentCommandAction, canPerformIncidentAction } from "@/lib/incident-command-center-engine/audit";
import {
  INCIDENT_COMMAND_CENTER_HISTORY_KEY,
  INCIDENT_COMMAND_CENTER_REPORTS_KEY,
  INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
  INCIDENT_COMMAND_CENTER_STATE_KEY,
} from "@/lib/incident-command-center-engine/keys";
import { INCIDENT_PUSH_TYPES, INCIDENT_REPORT_TYPES } from "@/lib/incident-command-center-engine/registry";
import type {
  IncidentCommandSettings,
  IncidentHistoryEvent,
  IncidentReportRecord,
  IncidentStateOverride,
} from "@/lib/incident-command-center-engine/types";
import { executeOmegaEnterpriseAction } from "@/lib/omega-enterprise-mobile-engine/engine";

export function createDefaultIncidentCommandSettings(): IncidentCommandSettings {
  return {
    maintenanceMode: false,
    emergencyLock: false,
    disableLogin: false,
    pauseMarketplace: false,
    pausePayments: false,
    pauseWallet: false,
    requireBiometric: true,
    requireMfa: true,
    suppressRepeatedAlerts: true,
    suppressWindowMinutes: 15,
    liveRefreshSeconds: 30,
    autoEscalateCritical: true,
    pushCritical: true,
    pushSilent: false,
    pushSecurity: true,
    pushEmergency: true,
    pushMaintenance: true,
    pushRelease: true,
    pushCompliance: true,
    pushDevice: true,
  };
}

export async function getIncidentStateOverrides(): Promise<Record<string, IncidentStateOverride>> {
  return getPlatformSetting(INCIDENT_COMMAND_CENTER_STATE_KEY, {});
}

export async function getIncidentCommandSettings(): Promise<IncidentCommandSettings> {
  const { incidentCommandConfigLifecycle } = await import("@/lib/incident-command-center-engine/config");
  const live = await incidentCommandConfigLifecycle.readLive();
  return live.settings;
}

export async function getIncidentReports(): Promise<IncidentReportRecord[]> {
  return getPlatformSetting(INCIDENT_COMMAND_CENTER_REPORTS_KEY, []);
}

export async function getIncidentHistory(): Promise<IncidentHistoryEvent[]> {
  return getPlatformSetting(INCIDENT_COMMAND_CENTER_HISTORY_KEY, []);
}

async function appendHistory(entry: IncidentHistoryEvent, actorId: string) {
  const history = await getIncidentHistory();
  await updatePlatformSetting({
    actorId,
    key: INCIDENT_COMMAND_CENTER_HISTORY_KEY,
    value: [entry, ...history].slice(0, 200) as unknown as Json,
  });
}

async function saveOverride(incidentId: string, patch: Partial<IncidentStateOverride>, actorId: string) {
  const overrides = await getIncidentStateOverrides();
  const next = {
    ...overrides,
    [incidentId]: {
      ...overrides[incidentId],
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    },
  };
  await updatePlatformSetting({ actorId, key: INCIDENT_COMMAND_CENTER_STATE_KEY, value: next as unknown as Json });
  return next;
}

const PROTECTED = new Set([
  "maintenance-mode",
  "emergency-lock",
  "disable-login",
  "pause-marketplace",
  "pause-payments",
  "pause-wallet",
  "emergency-broadcast",
]);

export async function executeIncidentCommandAction(
  action: string,
  actorId: string,
  payload?: {
    incidentId?: string;
    assignee?: string;
    format?: "pdf" | "csv" | "xlsx";
    reportType?: string;
    confirmed?: boolean;
    document?: import("@/lib/incident-command-center-engine/config").IncidentCommandConfigDocument;
    historyId?: string;
  },
): Promise<void> {
  const { isIncidentCommandConfigAction, executeIncidentCommandConfigAction } = await import(
    "@/lib/incident-command-center-engine/config-actions"
  );
  if (isIncidentCommandConfigAction(action)) {
    await executeIncidentCommandConfigAction(action, actorId, payload);
    return;
  }

  const settings = await getIncidentCommandSettings();
  const permission = canPerformIncidentAction({ action, settings });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  if (PROTECTED.has(action) && !payload?.confirmed) {
    throw new Error("Confirmation required for protected emergency action");
  }

  switch (action) {
    case "run-scan":
      await executeOmegaEnterpriseAction("run-scan", actorId);
      break;
    case "acknowledge":
      if (!payload?.incidentId) throw new Error("incidentId required");
      await saveOverride(payload.incidentId, { status: "acknowledged", resolutionProgress: 35 }, actorId);
      break;
    case "assign":
      if (!payload?.incidentId || !payload.assignee) throw new Error("incidentId and assignee required");
      await saveOverride(payload.incidentId, { status: "investigating", assignee: payload.assignee, resolutionProgress: 50 }, actorId);
      break;
    case "close":
      if (!payload?.incidentId) throw new Error("incidentId required");
      await saveOverride(payload.incidentId, { status: "closed", resolutionProgress: 100 }, actorId);
      break;
    case "ignore":
      if (!payload?.incidentId) throw new Error("incidentId required");
      await saveOverride(payload.incidentId, { status: "ignored", resolutionProgress: 0 }, actorId);
      break;
    case "incident-report":
    case "export-report": {
      const reportDef = INCIDENT_REPORT_TYPES.find((r) => r.id === payload?.reportType) ?? INCIDENT_REPORT_TYPES[0]!;
      const reports = await getIncidentReports();
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_REPORTS_KEY,
        value: [
          {
            id: `inc-rep-${Date.now().toString(36)}`,
            label: reportDef.label,
            format: payload?.format ?? "pdf",
            generatedAt: new Date().toISOString(),
          },
          ...reports,
        ].slice(0, 40) as unknown as Json,
      });
      break;
    }
    case "maintenance-mode":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, maintenanceMode: !settings.maintenanceMode } as unknown as Json,
      });
      await executeOmegaEnterpriseAction("maintenance-mode", actorId);
      break;
    case "emergency-lock":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, emergencyLock: !settings.emergencyLock } as unknown as Json,
      });
      break;
    case "disable-login":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, disableLogin: !settings.disableLogin } as unknown as Json,
      });
      break;
    case "pause-marketplace":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, pauseMarketplace: !settings.pauseMarketplace } as unknown as Json,
      });
      break;
    case "pause-payments":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, pausePayments: !settings.pausePayments } as unknown as Json,
      });
      break;
    case "pause-wallet":
      await updatePlatformSetting({
        actorId,
        key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
        value: { ...settings, pauseWallet: !settings.pauseWallet } as unknown as Json,
      });
      break;
    case "emergency-broadcast":
      break;
    default:
      throw new Error("Unknown action");
  }

  await appendHistory(
    {
      id: `hist-${Date.now().toString(36)}`,
      incidentId: payload?.incidentId ?? "system",
      action,
      detail: payload?.assignee ? `Assigned to ${payload.assignee}` : `Action ${action} executed`,
      actorId,
      timestamp: new Date().toISOString(),
    },
    actorId,
  );

  await auditIncidentCommandAction({ actorId, action, incidentId: payload?.incidentId, newValue: payload });
}

export function createDefaultPushChannels() {
  return INCIDENT_PUSH_TYPES.map((label, index) => ({
    id: `push-${index}`,
    label,
    enabled: index !== 1,
  }));
}
