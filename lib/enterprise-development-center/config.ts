import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import { createDefaultDevelopmentSettings, createDefaultDevelopmentState } from "@/lib/enterprise-development-center/engine";
import {
  ENTERPRISE_DEVELOPMENT_DRAFT_KEY,
  ENTERPRISE_DEVELOPMENT_HISTORY_KEY,
  ENTERPRISE_DEVELOPMENT_LIVE_KEY,
} from "@/lib/enterprise-development-center/keys";
import type { DevelopmentSettings, DevelopmentState } from "@/lib/enterprise-development-center/types";

export type DevelopmentFeatureFlags = Record<(typeof ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type DevelopmentConfigDocument = EnterpriseConfigDocument<DevelopmentSettings & DevelopmentState, DevelopmentFeatureFlags>;
export type DevelopmentConfigHistoryEntry = EnterpriseConfigHistoryEntry<DevelopmentConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): DevelopmentConfigDocument {
  const state = createDefaultDevelopmentState();
  const settings = createDefaultDevelopmentSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.featureFlags) as DevelopmentFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: DevelopmentConfigDocument): DevelopmentConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultDevelopmentState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      projectTree: doc.settings?.projectTree ?? defaultState.projectTree,
      modules: doc.settings?.modules ?? defaultState.modules,
      architectureNodes: doc.settings?.architectureNodes ?? defaultState.architectureNodes,
      dependencyLinks: doc.settings?.dependencyLinks ?? defaultState.dependencyLinks,
      apiEndpoints: doc.settings?.apiEndpoints ?? defaultState.apiEndpoints,
      databaseTables: doc.settings?.databaseTables ?? defaultState.databaseTables,
      storageBuckets: doc.settings?.storageBuckets ?? defaultState.storageBuckets,
      builds: doc.settings?.builds ?? defaultState.builds,
      releases: doc.settings?.releases ?? defaultState.releases,
      aiEngines: doc.settings?.aiEngines ?? defaultState.aiEngines,
      technicalDebt: doc.settings?.technicalDebt ?? defaultState.technicalDebt,
      codeQuality: doc.settings?.codeQuality ?? defaultState.codeQuality,
      performanceMetrics: doc.settings?.performanceMetrics ?? defaultState.performanceMetrics,
      validationResults: doc.settings?.validationResults ?? defaultState.validationResults,
    },
    featureFlags: mergeFeatureFlags(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR, doc.featureFlags) as DevelopmentFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const developmentConfigLifecycle = createConfigLifecycle<
  DevelopmentSettings & DevelopmentState,
  DevelopmentFeatureFlags,
  DevelopmentConfigHistoryEntry
>({
  moduleId: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_DEVELOPMENT_DRAFT_KEY,
  liveKey: ENTERPRISE_DEVELOPMENT_LIVE_KEY,
  historyKey: ENTERPRISE_DEVELOPMENT_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `dev-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getDevelopmentLiveDocument(): Promise<DevelopmentConfigDocument> {
  return developmentConfigLifecycle.readLive();
}

export async function getDevelopmentDraftDocument(): Promise<DevelopmentConfigDocument> {
  return developmentConfigLifecycle.getDraft();
}

export function detectDevelopmentPendingPublish(draft: DevelopmentConfigDocument, live: DevelopmentConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
