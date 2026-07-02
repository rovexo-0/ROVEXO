import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import {
  INCIDENT_TIMELINE_DRAFT_KEY,
  INCIDENT_TIMELINE_HISTORY_KEY,
  INCIDENT_TIMELINE_LIVE_KEY,
  INCIDENT_TIMELINE_SETTINGS_KEY,
} from "@/lib/incident-timeline-engine/keys";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";
import { createDefaultIncidentTimelineSettings } from "@/lib/incident-timeline-engine/engine";
import type { IncidentTimelineSettings } from "@/lib/incident-timeline-engine/types";
import type {
  EnterpriseConfigDocument,
  EnterpriseConfigHistoryEntry,
} from "@/lib/enterprise-architecture/types";

export type IncidentTimelineFeatureFlags = Record<
  (typeof INCIDENT_TIMELINE_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type IncidentTimelineConfigDocument = EnterpriseConfigDocument<
  IncidentTimelineSettings,
  IncidentTimelineFeatureFlags
>;

export type IncidentTimelineConfigHistoryEntry = EnterpriseConfigHistoryEntry<IncidentTimelineConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): IncidentTimelineConfigDocument {
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(INCIDENT_TIMELINE_MODULE_DESCRIPTOR.featureFlags) as IncidentTimelineFeatureFlags,
    settings: createDefaultIncidentTimelineSettings(),
    auditLog: [],
  };
}

function normalizeDocument(doc: IncidentTimelineConfigDocument): IncidentTimelineConfigDocument {
  return {
    ...createDefaultDocument(doc.label),
    ...doc,
    settings: { ...createDefaultIncidentTimelineSettings(), ...doc.settings },
    featureFlags: mergeFeatureFlags(INCIDENT_TIMELINE_MODULE_DESCRIPTOR, doc.featureFlags) as IncidentTimelineFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const incidentTimelineConfigLifecycle = createConfigLifecycle<
  IncidentTimelineSettings,
  IncidentTimelineFeatureFlags,
  IncidentTimelineConfigHistoryEntry
>({
  moduleId: INCIDENT_TIMELINE_MODULE_DESCRIPTOR.id,
  draftKey: INCIDENT_TIMELINE_DRAFT_KEY,
  liveKey: INCIDENT_TIMELINE_LIVE_KEY,
  historyKey: INCIDENT_TIMELINE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `itl-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      actorId: input.actorId,
      moduleId: INCIDENT_TIMELINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: INCIDENT_TIMELINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function syncIncidentTimelineSettingsFromLive(actorId: string): Promise<void> {
  const live = await incidentTimelineConfigLifecycle.readLive();
  const { updatePlatformSetting } = await import("@/lib/super-admin/settings");
  await updatePlatformSetting({
    actorId,
    key: INCIDENT_TIMELINE_SETTINGS_KEY,
    value: live.settings,
  });
}

export { INCIDENT_TIMELINE_SETTINGS_KEY };
