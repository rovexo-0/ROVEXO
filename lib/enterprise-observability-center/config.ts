import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";
import { createDefaultObservabilitySettings, createDefaultObservabilityState } from "@/lib/enterprise-observability-center/engine";
import {
  OBSERVABILITY_DRAFT_KEY,
  OBSERVABILITY_HISTORY_KEY,
  OBSERVABILITY_LIVE_KEY,
} from "@/lib/enterprise-observability-center/keys";
import type { ObservabilitySettings, ObservabilityState } from "@/lib/enterprise-observability-center/types";

export type ObservabilityFeatureFlags = Record<(typeof OBSERVABILITY_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type ObservabilityConfigDocument = EnterpriseConfigDocument<ObservabilitySettings & ObservabilityState, ObservabilityFeatureFlags>;
export type ObservabilityConfigHistoryEntry = EnterpriseConfigHistoryEntry<ObservabilityConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): ObservabilityConfigDocument {
  const state = createDefaultObservabilityState();
  const settings = createDefaultObservabilitySettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(OBSERVABILITY_MODULE_DESCRIPTOR.featureFlags) as ObservabilityFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: ObservabilityConfigDocument): ObservabilityConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultObservabilityState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      healthMetrics: doc.settings?.healthMetrics ?? defaultState.healthMetrics,
      subsystems: doc.settings?.subsystems ?? defaultState.subsystems,
      telemetry: doc.settings?.telemetry ?? defaultState.telemetry,
      alerts: doc.settings?.alerts ?? defaultState.alerts,
      topology: doc.settings?.topology ?? defaultState.topology,
      diagnostics: doc.settings?.diagnostics ?? defaultState.diagnostics,
      timeline: doc.settings?.timeline ?? defaultState.timeline,
      capacityForecasts: doc.settings?.capacityForecasts ?? defaultState.capacityForecasts,
      omegaFeed: doc.settings?.omegaFeed ?? defaultState.omegaFeed,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(OBSERVABILITY_MODULE_DESCRIPTOR, doc.featureFlags) as ObservabilityFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const observabilityConfigLifecycle = createConfigLifecycle<
  ObservabilitySettings & ObservabilityState,
  ObservabilityFeatureFlags,
  ObservabilityConfigHistoryEntry
>({
  moduleId: OBSERVABILITY_MODULE_DESCRIPTOR.id,
  draftKey: OBSERVABILITY_DRAFT_KEY,
  liveKey: OBSERVABILITY_LIVE_KEY,
  historyKey: OBSERVABILITY_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `eoc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: OBSERVABILITY_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: OBSERVABILITY_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getObservabilityLiveDocument(): Promise<ObservabilityConfigDocument> {
  return observabilityConfigLifecycle.readLive();
}

export async function getObservabilityDraftDocument(): Promise<ObservabilityConfigDocument> {
  return observabilityConfigLifecycle.getDraft();
}

export function detectObservabilityPendingPublish(draft: ObservabilityConfigDocument, live: ObservabilityConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
