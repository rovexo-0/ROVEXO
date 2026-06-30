import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import { createDefaultGovernanceSettings, createDefaultGovernanceState } from "@/lib/enterprise-governance-center/engine";
import {
  ENTERPRISE_GOVERNANCE_DRAFT_KEY,
  ENTERPRISE_GOVERNANCE_HISTORY_KEY,
  ENTERPRISE_GOVERNANCE_LIVE_KEY,
} from "@/lib/enterprise-governance-center/keys";
import type { GovernanceSettings, GovernanceState } from "@/lib/enterprise-governance-center/types";

export type GovernanceFeatureFlags = Record<(typeof ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type GovernanceConfigDocument = EnterpriseConfigDocument<GovernanceSettings & GovernanceState, GovernanceFeatureFlags>;
export type GovernanceConfigHistoryEntry = EnterpriseConfigHistoryEntry<GovernanceConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): GovernanceConfigDocument {
  const state = createDefaultGovernanceState();
  const settings = createDefaultGovernanceSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.featureFlags) as GovernanceFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: GovernanceConfigDocument): GovernanceConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultGovernanceState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      constitution: doc.settings?.constitution ?? defaultState.constitution,
      architectureViolations: doc.settings?.architectureViolations ?? defaultState.architectureViolations,
      moduleCompliance: doc.settings?.moduleCompliance ?? defaultState.moduleCompliance,
      rules: doc.settings?.rules ?? defaultState.rules,
      technicalDebt: doc.settings?.technicalDebt ?? defaultState.technicalDebt,
      enterpriseScores: doc.settings?.enterpriseScores ?? defaultState.enterpriseScores,
      certificates: doc.settings?.certificates ?? defaultState.certificates,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
      validationRuns: doc.settings?.validationRuns ?? defaultState.validationRuns,
      amendments: doc.settings?.amendments ?? defaultState.amendments,
    },
    featureFlags: mergeFeatureFlags(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR, doc.featureFlags) as GovernanceFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const governanceConfigLifecycle = createConfigLifecycle<
  GovernanceSettings & GovernanceState,
  GovernanceFeatureFlags,
  GovernanceConfigHistoryEntry
>({
  moduleId: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_GOVERNANCE_DRAFT_KEY,
  liveKey: ENTERPRISE_GOVERNANCE_LIVE_KEY,
  historyKey: ENTERPRISE_GOVERNANCE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `gov-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getGovernanceLiveDocument(): Promise<GovernanceConfigDocument> {
  return governanceConfigLifecycle.readLive();
}

export async function getGovernanceDraftDocument(): Promise<GovernanceConfigDocument> {
  return governanceConfigLifecycle.getDraft();
}

export function detectGovernancePendingPublish(draft: GovernanceConfigDocument, live: GovernanceConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
