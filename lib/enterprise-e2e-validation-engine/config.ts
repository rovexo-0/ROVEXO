import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";
import { createDefaultE2eValidationSettings, createDefaultE2eValidationState } from "@/lib/enterprise-e2e-validation-engine/engine";
import {
  E2E_VALIDATION_DRAFT_KEY,
  E2E_VALIDATION_HISTORY_KEY,
  E2E_VALIDATION_LIVE_KEY,
} from "@/lib/enterprise-e2e-validation-engine/keys";
import type { E2eValidationSettings, E2eValidationState } from "@/lib/enterprise-e2e-validation-engine/types";

export type E2eValidationFeatureFlags = Record<(typeof E2E_VALIDATION_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type E2eValidationConfigDocument = EnterpriseConfigDocument<E2eValidationSettings & E2eValidationState, E2eValidationFeatureFlags>;
export type E2eValidationConfigHistoryEntry = EnterpriseConfigHistoryEntry<E2eValidationConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): E2eValidationConfigDocument {
  const state = createDefaultE2eValidationState();
  const settings = createDefaultE2eValidationSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(E2E_VALIDATION_MODULE_DESCRIPTOR.featureFlags) as E2eValidationFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: E2eValidationConfigDocument): E2eValidationConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultE2eValidationState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      omegaScores: doc.settings?.omegaScores ?? defaultState.omegaScores,
      uiValidations: doc.settings?.uiValidations ?? defaultState.uiValidations,
      routeValidations: doc.settings?.routeValidations ?? defaultState.routeValidations,
      buyerFlows: doc.settings?.buyerFlows ?? defaultState.buyerFlows,
      sellerFlows: doc.settings?.sellerFlows ?? defaultState.sellerFlows,
      companyFlows: doc.settings?.companyFlows ?? defaultState.companyFlows,
      superAdminFlows: doc.settings?.superAdminFlows ?? defaultState.superAdminFlows,
      databaseValidations: doc.settings?.databaseValidations ?? defaultState.databaseValidations,
      apiValidations: doc.settings?.apiValidations ?? defaultState.apiValidations,
      businessRules: doc.settings?.businessRules ?? defaultState.businessRules,
      regressionRuns: doc.settings?.regressionRuns ?? defaultState.regressionRuns,
      failures: doc.settings?.failures ?? defaultState.failures,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(E2E_VALIDATION_MODULE_DESCRIPTOR, doc.featureFlags) as E2eValidationFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const e2eValidationConfigLifecycle = createConfigLifecycle<
  E2eValidationSettings & E2eValidationState,
  E2eValidationFeatureFlags,
  E2eValidationConfigHistoryEntry
>({
  moduleId: E2E_VALIDATION_MODULE_DESCRIPTOR.id,
  draftKey: E2E_VALIDATION_DRAFT_KEY,
  liveKey: E2E_VALIDATION_LIVE_KEY,
  historyKey: E2E_VALIDATION_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `e2e-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: E2E_VALIDATION_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: E2E_VALIDATION_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getE2eValidationLiveDocument(): Promise<E2eValidationConfigDocument> {
  return e2eValidationConfigLifecycle.readLive();
}

export async function getE2eValidationDraftDocument(): Promise<E2eValidationConfigDocument> {
  return e2eValidationConfigLifecycle.getDraft();
}

export function detectE2eValidationPendingPublish(draft: E2eValidationConfigDocument, live: E2eValidationConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
