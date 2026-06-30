import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";
import { createDefaultGlobalUiIntegritySettings, createDefaultGlobalUiIntegrityState } from "@/lib/omega-global-ui-integrity-engine/engine";
import {
  GLOBAL_UI_INTEGRITY_DRAFT_KEY,
  GLOBAL_UI_INTEGRITY_HISTORY_KEY,
  GLOBAL_UI_INTEGRITY_LIVE_KEY,
} from "@/lib/omega-global-ui-integrity-engine/keys";
import type { GlobalUiIntegritySettings, GlobalUiIntegrityState } from "@/lib/omega-global-ui-integrity-engine/types";

export type GlobalUiIntegrityFeatureFlags = Record<(typeof GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type GlobalUiIntegrityConfigDocument = EnterpriseConfigDocument<GlobalUiIntegritySettings & GlobalUiIntegrityState, GlobalUiIntegrityFeatureFlags>;
export type GlobalUiIntegrityConfigHistoryEntry = EnterpriseConfigHistoryEntry<GlobalUiIntegrityConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): GlobalUiIntegrityConfigDocument {
  const state = createDefaultGlobalUiIntegrityState();
  const settings = createDefaultGlobalUiIntegritySettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.featureFlags) as GlobalUiIntegrityFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: GlobalUiIntegrityConfigDocument): GlobalUiIntegrityConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultGlobalUiIntegrityState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      omegaScores: doc.settings?.omegaScores ?? defaultState.omegaScores,
      screens: doc.settings?.screens ?? defaultState.screens,
      uiValidation: doc.settings?.uiValidation ?? defaultState.uiValidation,
      uxValidation: doc.settings?.uxValidation ?? defaultState.uxValidation,
      navigation: doc.settings?.navigation ?? defaultState.navigation,
      categories: doc.settings?.categories ?? defaultState.categories,
      layout: doc.settings?.layout ?? defaultState.layout,
      autoRepairActions: doc.settings?.autoRepairActions ?? defaultState.autoRepairActions,
      globalScan: doc.settings?.globalScan ?? defaultState.globalScan,
      failures: doc.settings?.failures ?? defaultState.failures,
      productionRequirements: doc.settings?.productionRequirements ?? defaultState.productionRequirements,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR, doc.featureFlags) as GlobalUiIntegrityFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const globalUiIntegrityConfigLifecycle = createConfigLifecycle<
  GlobalUiIntegritySettings & GlobalUiIntegrityState,
  GlobalUiIntegrityFeatureFlags,
  GlobalUiIntegrityConfigHistoryEntry
>({
  moduleId: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id,
  draftKey: GLOBAL_UI_INTEGRITY_DRAFT_KEY,
  liveKey: GLOBAL_UI_INTEGRITY_LIVE_KEY,
  historyKey: GLOBAL_UI_INTEGRITY_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `gui-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getGlobalUiIntegrityLiveDocument(): Promise<GlobalUiIntegrityConfigDocument> {
  return globalUiIntegrityConfigLifecycle.readLive();
}

export async function getGlobalUiIntegrityDraftDocument(): Promise<GlobalUiIntegrityConfigDocument> {
  return globalUiIntegrityConfigLifecycle.getDraft();
}

export function detectGlobalUiIntegrityPendingPublish(draft: GlobalUiIntegrityConfigDocument, live: GlobalUiIntegrityConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
