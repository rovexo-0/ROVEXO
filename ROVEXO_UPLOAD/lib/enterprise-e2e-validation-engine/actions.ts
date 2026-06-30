import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformE2eValidationAction } from "@/lib/enterprise-e2e-validation-engine/audit";
import { getE2eValidationLiveDocument, e2eValidationConfigLifecycle } from "@/lib/enterprise-e2e-validation-engine/config";
import { executeE2eValidationConfigAction, isE2eValidationConfigAction } from "@/lib/enterprise-e2e-validation-engine/config-actions";
import type { E2eValidationConfigDocument } from "@/lib/enterprise-e2e-validation-engine/config";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";
import {
  advanceRegressionRun,
  analyzeFailure,
  computeE2eEnterpriseScore,
  isCertificationEligible,
  isProtectedValidationTarget,
  runFullPlatformValidation,
  runRegressionTest,
  scanUiValidations,
} from "@/lib/enterprise-e2e-validation-engine/engine";
import { exportE2eValidationSnapshot, isValidE2eExportFormat } from "@/lib/enterprise-e2e-validation-engine/export";
import { getE2eValidationSnapshot } from "@/lib/enterprise-e2e-validation-engine/reader";

export async function executeE2eValidationAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isE2eValidationConfigAction(action)) {
    return executeE2eValidationConfigAction(action, actorId, payload as { document?: E2eValidationConfigDocument; historyId?: string });
  }

  const permission = canPerformE2eValidationAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getE2eValidationLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: E2E_VALIDATION_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.validationOnlyMode === false) {
    throw new Error("Validation-only mode must remain enabled — protected areas cannot be auto-modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedValidationTarget(target)) {
    throw new Error("Protected area — validation only, no modifications allowed");
  }

  switch (action) {
    case "validate": {
      const result = runFullPlatformValidation();
      const uiScans = scanUiValidations();
      await e2eValidationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            omegaScores: result.scores,
            uiValidations: [...uiScans, ...state.uiValidations].slice(0, 50),
            dashboard: {
              ...state.dashboard,
              overallPassRate: result.passRate,
              uiCoverage: Math.min(100, state.dashboard.uiCoverage + 0.5),
              enterpriseScore: computeE2eEnterpriseScore({ dashboard: state.dashboard, omegaScores: result.scores }),
              certificationEligible: isCertificationEligible({ ...state.dashboard, overallPassRate: result.passRate }, result.scores),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { passRate: result.passRate, status: result.status };
    }
    case "regression": {
      const existingId = payload?.regressionId ? String(payload.regressionId) : undefined;
      if (existingId) {
        const updated = state.regressionRuns.map((r) => (r.id === existingId ? advanceRegressionRun(r) : r));
        await e2eValidationConfigLifecycle.saveDraft(
          {
            ...live,
            settings: { ...state, regressionRuns: updated },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { regressionId: existingId, advanced: true };
      }
      const trigger = String(payload?.trigger ?? "Manual regression run");
      const run = runRegressionTest(trigger);
      await e2eValidationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            regressionRuns: [run, ...state.regressionRuns].slice(0, 20),
            dashboard: { ...state.dashboard, regressionQueue: state.dashboard.regressionQueue + 1 },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { regressionId: run.id };
    }
    case "analyze": {
      const issue = String(payload?.issue ?? "Validation failure detected");
      const moduleId = payload?.moduleId ? String(payload.moduleId) : undefined;
      const analysis = analyzeFailure(issue, moduleId);
      await e2eValidationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            failures: [analysis, ...state.failures].slice(0, 25),
            dashboard: {
              ...state.dashboard,
              openFailures: state.dashboard.openFailures + (analysis.status === "blocked" ? 0 : 1),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { failureId: analysis.id, blocked: analysis.status === "blocked" };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidE2eExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getE2eValidationSnapshot();
      return { data: exportE2eValidationSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
