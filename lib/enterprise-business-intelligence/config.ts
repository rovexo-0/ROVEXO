import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { createDefaultBiSettings, createDefaultBiState } from "@/lib/enterprise-business-intelligence/engine";
import { ENTERPRISE_BI_DRAFT_KEY, ENTERPRISE_BI_HISTORY_KEY, ENTERPRISE_BI_LIVE_KEY } from "@/lib/enterprise-business-intelligence/keys";
import type { BiSettings, BiState } from "@/lib/enterprise-business-intelligence/types";

export type BiFeatureFlags = Record<(typeof ENTERPRISE_BI_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type BiConfigDocument = EnterpriseConfigDocument<BiSettings & BiState, BiFeatureFlags>;
export type BiConfigHistoryEntry = EnterpriseConfigHistoryEntry<BiConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): BiConfigDocument {
  const state = createDefaultBiState();
  const settings = createDefaultBiSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(ENTERPRISE_BI_MODULE_DESCRIPTOR.featureFlags) as BiFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: BiConfigDocument): BiConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultBiState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      kpis: doc.settings?.kpis ?? defaultState.kpis,
      financial: doc.settings?.financial ?? defaultState.financial,
      marketplace: doc.settings?.marketplace ?? defaultState.marketplace,
      userAnalytics: doc.settings?.userAnalytics ?? defaultState.userAnalytics,
      traffic: doc.settings?.traffic ?? defaultState.traffic,
      forecasts: doc.settings?.forecasts ?? defaultState.forecasts,
      reports: doc.settings?.reports ?? defaultState.reports,
    },
    featureFlags: mergeFeatureFlags(ENTERPRISE_BI_MODULE_DESCRIPTOR, doc.featureFlags) as BiFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const biConfigLifecycle = createConfigLifecycle<BiSettings & BiState, BiFeatureFlags, BiConfigHistoryEntry>({
  moduleId: ENTERPRISE_BI_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_BI_DRAFT_KEY,
  liveKey: ENTERPRISE_BI_LIVE_KEY,
  historyKey: ENTERPRISE_BI_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `bi-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_BI_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_BI_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getBiLiveDocument(): Promise<BiConfigDocument> {
  return biConfigLifecycle.readLive();
}

export async function getBiDraftDocument(): Promise<BiConfigDocument> {
  return biConfigLifecycle.getDraft();
}

export function detectBiPendingPublish(draft: BiConfigDocument, live: BiConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
