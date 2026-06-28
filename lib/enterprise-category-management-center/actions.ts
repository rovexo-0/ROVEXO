import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformCategoryManagementAction } from "@/lib/enterprise-category-management-center/audit";
import { getCategoryManagementLiveDocument, categoryManagementConfigLifecycle } from "@/lib/enterprise-category-management-center/config";
import { executeCategoryManagementConfigAction, isCategoryManagementConfigAction } from "@/lib/enterprise-category-management-center/config-actions";
import type { CategoryManagementConfigDocument } from "@/lib/enterprise-category-management-center/config";
import { CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-category-management-center/descriptor";
import {
  analyzeCategoryIssue,
  computeCategoryEnterpriseScore,
  isCategoryCertificationEligible,
  isProtectedCategoryTarget,
  mergeDbCategoriesIntoState,
  runTaxonomyValidation,
} from "@/lib/enterprise-category-management-center/engine";
import { exportCategoryManagementSnapshot, isValidCategoryManagementExportFormat } from "@/lib/enterprise-category-management-center/export";
import { getCategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/reader";

export async function executeCategoryManagementAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isCategoryManagementConfigAction(action)) {
    return executeCategoryManagementConfigAction(action, actorId, payload as { document?: CategoryManagementConfigDocument; historyId?: string });
  }

  const permission = canPerformCategoryManagementAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getCategoryManagementLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.validationOnlyMode === false) {
    throw new Error("Validation-only mode must remain enabled — protected areas cannot be auto-modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedCategoryTarget(target)) {
    throw new Error("Protected area — validation only, no modifications allowed");
  }

  switch (action) {
    case "validate": {
      const result = runTaxonomyValidation();
      await categoryManagementConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            omegaScores: result.scores,
            dashboard: {
              ...state.dashboard,
              overallPassPercent: result.passPercent,
              enterpriseScore: computeCategoryEnterpriseScore({ dashboard: state.dashboard, omegaScores: result.scores }),
              certificationGranted: isCategoryCertificationEligible({ ...state.dashboard, overallPassPercent: result.passPercent }, result.scores),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { passPercent: result.passPercent, status: result.status };
    }
    case "sync": {
      const { syncEnterpriseTaxonomyToDatabase } = await import("@/lib/categories/sync-db");
      const syncResult = await syncEnterpriseTaxonomyToDatabase();
      await categoryManagementConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            dashboard: {
              ...state.dashboard,
              lastSyncAt: new Date().toISOString(),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { synced: syncResult.categoriesUpserted, filters: syncResult.filtersUpserted, errors: syncResult.errors.length };
    }
    case "analyze": {
      const issue = String(payload?.issue ?? "Taxonomy issue detected");
      const analysis = analyzeCategoryIssue(issue, target);
      await categoryManagementConfigLifecycle.saveDraft(
        {
          ...live,
          settings: state,
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { issueId: analysis.id, blocked: analysis.status === "blocked" };
    }
    case "certify": {
      if (state.dashboard.overallPassPercent < 100 && state.requirePass100) {
        throw new Error("PASS 100% required before category certification can be granted");
      }
      await categoryManagementConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            dashboard: { ...state.dashboard, certificationGranted: true },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { certified: true };
    }
    case "import":
    case "export": {
      if (action === "export") {
        const format = String(payload?.format ?? "json");
        if (!isValidCategoryManagementExportFormat(format)) throw new Error("Invalid export format");
        const snapshot = await getCategoryManagementSnapshot();
        return { data: exportCategoryManagementSnapshot(snapshot, format) };
      }
      throw new Error("Import requires file payload — use import-config action");
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
