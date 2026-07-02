import type { AdminCategory } from "@/lib/categories/admin";
import type { CategoryManagementSnapshot, CategoryManagementTab } from "@/lib/enterprise-category-management-center/types";
import {
  detectCategoryManagementPendingPublish,
  getCategoryManagementDraftDocument,
  getCategoryManagementLiveDocument,
  categoryManagementConfigLifecycle,
} from "@/lib/enterprise-category-management-center/config";
import { CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-category-management-center/descriptor";
import { computeCategoryEnterpriseScore, createDefaultCategoryManagementSettings, mergeDbCategoriesIntoState } from "@/lib/enterprise-category-management-center/engine";

export async function getCategoryManagementSnapshot(
  tab: CategoryManagementTab = "dashboard",
  dbCategories?: AdminCategory[],
): Promise<CategoryManagementSnapshot> {
  const live = await getCategoryManagementLiveDocument();
  const draft = await getCategoryManagementDraftDocument();
  let state = live.settings;
  if (dbCategories && dbCategories.length > 0) {
    state = { ...state, ...mergeDbCategoriesIntoState(state, dbCategories) };
  }
  const {
    dashboard,
    omegaScores,
    treeNodes,
    workspace,
    inspectorChecks,
    aiSuggestions,
    analytics,
    validationItems,
    versions,
    importExportJobs,
    reports,
    auditEntries,
    editorFields,
    treeFeatures,
    validationOnlyMode,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
    requirePass100,
    enableAiAssistant,
    enableVersionControl,
  } = state;
  const settings = {
    ...createDefaultCategoryManagementSettings(),
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
    requirePass100: requirePass100 ?? true,
    enableAiAssistant,
    enableVersionControl,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_category_management_center_v1 !== false;
  const enterpriseScore = enabled ? computeCategoryEnterpriseScore({ dashboard, omegaScores }) : 0;
  const history = await categoryManagementConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassPercent: 0, enterpriseScore: 0, certificationGranted: false },
    omegaScores: flags.omega_score_engine_enabled !== false ? omegaScores : [],
    treeNodes: flags.tree_editor_enabled !== false ? treeNodes : [],
    workspace,
    inspectorChecks,
    aiSuggestions: flags.ai_assistant_enabled !== false ? aiSuggestions : [],
    analytics,
    validationItems,
    versions: flags.version_control_enabled !== false ? versions : [],
    importExportJobs: flags.import_export_enabled !== false ? importExportJobs : [],
    reports,
    auditEntries,
    editorFields,
    treeFeatures,
    settings,
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectCategoryManagementPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 100 ? "healthy" : enterpriseScore >= 90 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Enterprise Category Management Center — master taxonomy platform" : "Category Management Center disabled",
    },
  };
}

export async function getCategoryManagementPageData(tab: CategoryManagementTab = "dashboard") {
  let dbCategories: AdminCategory[] | undefined;
  try {
    const { listAdminCategories } = await import("@/lib/categories/admin");
    dbCategories = await listAdminCategories();
  } catch {
    dbCategories = undefined;
  }
  const snapshot = await getCategoryManagementSnapshot(tab, dbCategories);
  return { snapshot, descriptor: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR };
}

export function validateCategoryManagementReadiness(snapshot: CategoryManagementSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_category_management_center_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassPercent >= 100,
    snapshot.treeNodes.length > 0,
    snapshot.omegaScores.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 80, score };
}
