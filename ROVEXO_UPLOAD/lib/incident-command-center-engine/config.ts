import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import {
  INCIDENT_COMMAND_CENTER_DRAFT_KEY,
  INCIDENT_COMMAND_CENTER_CONFIG_HISTORY_KEY,
  INCIDENT_COMMAND_CENTER_LIVE_KEY,
  INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
} from "@/lib/incident-command-center-engine/keys";
import { INCIDENT_COMMAND_MODULE_DESCRIPTOR } from "@/lib/incident-command-center-engine/descriptor";
import { createDefaultIncidentCommandSettings } from "@/lib/incident-command-center-engine/engine";
import type { IncidentCommandSettings } from "@/lib/incident-command-center-engine/types";
import type {
  EnterpriseConfigDocument,
  EnterpriseConfigHistoryEntry,
} from "@/lib/enterprise-architecture/types";

export type IncidentCommandFeatureFlags = Record<
  (typeof INCIDENT_COMMAND_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type IncidentCommandConfigDocument = EnterpriseConfigDocument<
  IncidentCommandSettings,
  IncidentCommandFeatureFlags
>;

export type IncidentCommandConfigHistoryEntry = EnterpriseConfigHistoryEntry<IncidentCommandConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): IncidentCommandConfigDocument {
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(INCIDENT_COMMAND_MODULE_DESCRIPTOR.featureFlags) as IncidentCommandFeatureFlags,
    settings: createDefaultIncidentCommandSettings(),
    auditLog: [],
  };
}

function normalizeDocument(doc: IncidentCommandConfigDocument): IncidentCommandConfigDocument {
  return {
    ...createDefaultDocument(doc.label),
    ...doc,
    settings: { ...createDefaultIncidentCommandSettings(), ...doc.settings },
    featureFlags: mergeFeatureFlags(INCIDENT_COMMAND_MODULE_DESCRIPTOR, doc.featureFlags) as IncidentCommandFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const incidentCommandConfigLifecycle = createConfigLifecycle<
  IncidentCommandSettings,
  IncidentCommandFeatureFlags,
  IncidentCommandConfigHistoryEntry
>({
  moduleId: INCIDENT_COMMAND_MODULE_DESCRIPTOR.id,
  draftKey: INCIDENT_COMMAND_CENTER_DRAFT_KEY,
  liveKey: INCIDENT_COMMAND_CENTER_LIVE_KEY,
  historyKey: INCIDENT_COMMAND_CENTER_CONFIG_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `icc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      actorId: input.actorId,
      moduleId: INCIDENT_COMMAND_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: INCIDENT_COMMAND_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function syncIncidentCommandSettingsFromLive(actorId: string): Promise<void> {
  const live = await incidentCommandConfigLifecycle.readLive();
  const { updatePlatformSetting } = await import("@/lib/super-admin/settings");
  await updatePlatformSetting({
    actorId,
    key: INCIDENT_COMMAND_CENTER_SETTINGS_KEY,
    value: live.settings,
  });
}

export { INCIDENT_COMMAND_CENTER_SETTINGS_KEY };
