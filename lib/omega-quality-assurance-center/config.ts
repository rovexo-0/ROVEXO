import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";
import { createDefaultQaSettings, createDefaultQaState } from "@/lib/omega-quality-assurance-center/engine";
import {
  OMEGA_QA_DRAFT_KEY,
  OMEGA_QA_HISTORY_KEY,
  OMEGA_QA_LIVE_KEY,
} from "@/lib/omega-quality-assurance-center/keys";
import type { QaSettings, QaState } from "@/lib/omega-quality-assurance-center/types";

export type QaFeatureFlags = Record<(typeof OMEGA_QA_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type QaConfigDocument = EnterpriseConfigDocument<QaSettings & QaState, QaFeatureFlags>;
export type QaConfigHistoryEntry = EnterpriseConfigHistoryEntry<QaConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): QaConfigDocument {
  const state = createDefaultQaState();
  const settings = createDefaultQaSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(OMEGA_QA_MODULE_DESCRIPTOR.featureFlags) as QaFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: QaConfigDocument): QaConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultQaState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      healthMetrics: doc.settings?.healthMetrics ?? defaultState.healthMetrics,
      platformDomains: doc.settings?.platformDomains ?? defaultState.platformDomains,
      registeredButtons: doc.settings?.registeredButtons ?? defaultState.registeredButtons,
      userFlows: doc.settings?.userFlows ?? defaultState.userFlows,
      aiValidations: doc.settings?.aiValidations ?? defaultState.aiValidations,
      fixCandidates: doc.settings?.fixCandidates ?? defaultState.fixCandidates,
      certifications: doc.settings?.certifications ?? defaultState.certifications,
      priorityIssues: doc.settings?.priorityIssues ?? defaultState.priorityIssues,
      moduleStatuses: doc.settings?.moduleStatuses ?? defaultState.moduleStatuses,
      validationRuns: doc.settings?.validationRuns ?? defaultState.validationRuns,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(OMEGA_QA_MODULE_DESCRIPTOR, doc.featureFlags) as QaFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const qaConfigLifecycle = createConfigLifecycle<
  QaSettings & QaState,
  QaFeatureFlags,
  QaConfigHistoryEntry
>({
  moduleId: OMEGA_QA_MODULE_DESCRIPTOR.id,
  draftKey: OMEGA_QA_DRAFT_KEY,
  liveKey: OMEGA_QA_LIVE_KEY,
  historyKey: OMEGA_QA_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `qa-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: OMEGA_QA_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: OMEGA_QA_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getQaLiveDocument(): Promise<QaConfigDocument> {
  return qaConfigLifecycle.readLive();
}

export async function getQaDraftDocument(): Promise<QaConfigDocument> {
  return qaConfigLifecycle.getDraft();
}

export function detectQaPendingPublish(draft: QaConfigDocument, live: QaConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
