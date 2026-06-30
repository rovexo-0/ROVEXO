import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-category-management-center/descriptor";
import { createDefaultCategoryManagementSettings, createDefaultCategoryManagementState } from "@/lib/enterprise-category-management-center/engine";
import {
  CATEGORY_MANAGEMENT_DRAFT_KEY,
  CATEGORY_MANAGEMENT_HISTORY_KEY,
  CATEGORY_MANAGEMENT_LIVE_KEY,
} from "@/lib/enterprise-category-management-center/keys";
import type { CategoryManagementSettings, CategoryManagementState } from "@/lib/enterprise-category-management-center/types";

export type CategoryManagementFeatureFlags = Record<(typeof CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type CategoryManagementConfigDocument = EnterpriseConfigDocument<CategoryManagementSettings & CategoryManagementState, CategoryManagementFeatureFlags>;
export type CategoryManagementConfigHistoryEntry = EnterpriseConfigHistoryEntry<CategoryManagementConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): CategoryManagementConfigDocument {
  const state = createDefaultCategoryManagementState();
  const settings = createDefaultCategoryManagementSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.featureFlags) as CategoryManagementFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: CategoryManagementConfigDocument): CategoryManagementConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultCategoryManagementState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      omegaScores: doc.settings?.omegaScores ?? defaultState.omegaScores,
      treeNodes: doc.settings?.treeNodes ?? defaultState.treeNodes,
      workspace: doc.settings?.workspace ?? defaultState.workspace,
      inspectorChecks: doc.settings?.inspectorChecks ?? defaultState.inspectorChecks,
      aiSuggestions: doc.settings?.aiSuggestions ?? defaultState.aiSuggestions,
      analytics: doc.settings?.analytics ?? defaultState.analytics,
      validationItems: doc.settings?.validationItems ?? defaultState.validationItems,
      versions: doc.settings?.versions ?? defaultState.versions,
      importExportJobs: doc.settings?.importExportJobs ?? defaultState.importExportJobs,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR, doc.featureFlags) as CategoryManagementFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const categoryManagementConfigLifecycle = createConfigLifecycle<
  CategoryManagementSettings & CategoryManagementState,
  CategoryManagementFeatureFlags,
  CategoryManagementConfigHistoryEntry
>({
  moduleId: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id,
  draftKey: CATEGORY_MANAGEMENT_DRAFT_KEY,
  liveKey: CATEGORY_MANAGEMENT_LIVE_KEY,
  historyKey: CATEGORY_MANAGEMENT_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `cat-mgmt-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getCategoryManagementLiveDocument(): Promise<CategoryManagementConfigDocument> {
  return categoryManagementConfigLifecycle.readLive();
}

export async function getCategoryManagementDraftDocument(): Promise<CategoryManagementConfigDocument> {
  return categoryManagementConfigLifecycle.getDraft();
}

export function detectCategoryManagementPendingPublish(draft: CategoryManagementConfigDocument, live: CategoryManagementConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
