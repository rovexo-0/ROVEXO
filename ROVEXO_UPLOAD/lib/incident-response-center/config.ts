import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import {
  createDefaultIncidentSettings,
  createDefaultIncidentState,
} from "@/lib/incident-response-center/engine";
import {
  INCIDENT_RESPONSE_DRAFT_KEY,
  INCIDENT_RESPONSE_HISTORY_KEY,
  INCIDENT_RESPONSE_LIVE_KEY,
} from "@/lib/incident-response-center/keys";
import type { IncidentSettings, IncidentState } from "@/lib/incident-response-center/types";

export type IncidentFeatureFlags = Record<
  (typeof INCIDENT_RESPONSE_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type IncidentConfigDocument = EnterpriseConfigDocument<
  IncidentSettings & IncidentState,
  IncidentFeatureFlags
>;

export type IncidentConfigHistoryEntry = EnterpriseConfigHistoryEntry<IncidentConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): IncidentConfigDocument {
  const state = createDefaultIncidentState();
  const settings = createDefaultIncidentSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      INCIDENT_RESPONSE_MODULE_DESCRIPTOR.featureFlags,
    ) as IncidentFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: IncidentConfigDocument): IncidentConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultIncidentState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      incidents: doc.settings?.incidents ?? defaultState.incidents,
      timeline: doc.settings?.timeline ?? defaultState.timeline,
      rootCauseAnalyses: doc.settings?.rootCauseAnalyses ?? defaultState.rootCauseAnalyses,
      postmortems: doc.settings?.postmortems ?? defaultState.postmortems,
      playbooks: doc.settings?.playbooks ?? defaultState.playbooks,
      aiSuggestions: doc.settings?.aiSuggestions ?? defaultState.aiSuggestions,
      automations: doc.settings?.automations ?? defaultState.automations,
    },
    featureFlags: mergeFeatureFlags(
      INCIDENT_RESPONSE_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as IncidentFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const incidentConfigLifecycle = createConfigLifecycle<
  IncidentSettings & IncidentState,
  IncidentFeatureFlags,
  IncidentConfigHistoryEntry
>({
  moduleId: INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id,
  draftKey: INCIDENT_RESPONSE_DRAFT_KEY,
  liveKey: INCIDENT_RESPONSE_LIVE_KEY,
  historyKey: INCIDENT_RESPONSE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `irc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getIncidentLiveDocument(): Promise<IncidentConfigDocument> {
  return incidentConfigLifecycle.readLive();
}

export async function getIncidentDraftDocument(): Promise<IncidentConfigDocument> {
  return incidentConfigLifecycle.getDraft();
}

export function detectIncidentPendingPublish(draft: IncidentConfigDocument, live: IncidentConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
