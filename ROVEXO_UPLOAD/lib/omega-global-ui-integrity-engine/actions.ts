import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformGlobalUiIntegrityAction } from "@/lib/omega-global-ui-integrity-engine/audit";
import { getGlobalUiIntegrityLiveDocument, globalUiIntegrityConfigLifecycle } from "@/lib/omega-global-ui-integrity-engine/config";
import { executeGlobalUiIntegrityConfigAction, isGlobalUiIntegrityConfigAction } from "@/lib/omega-global-ui-integrity-engine/config-actions";
import type { GlobalUiIntegrityConfigDocument } from "@/lib/omega-global-ui-integrity-engine/config";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";
import {
  computeGlobalUiEnterpriseScore,
  runFullGlobalUiValidation,
  runGlobalUiAutoRepair,
} from "@/lib/omega-global-ui-integrity-engine/engine";
import { isProtectedRepairTarget } from "@/lib/omega-global-ui-integrity-engine/repair";
import { exportGlobalUiIntegritySnapshot, isValidGlobalUiIntegrityExportFormat } from "@/lib/omega-global-ui-integrity-engine/export";
import { getGlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/reader";

export async function executeGlobalUiIntegrityAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isGlobalUiIntegrityConfigAction(action)) {
    return executeGlobalUiIntegrityConfigAction(action, actorId, payload as { document?: GlobalUiIntegrityConfigDocument; historyId?: string });
  }

  const permission = canPerformGlobalUiIntegrityAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getGlobalUiIntegrityLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id,
    action,
  });
  const state = live.settings;

  if (state.validationOnlyMode === false) {
    throw new Error("Validation-only mode must remain enabled — protected areas cannot be auto-modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedRepairTarget(target)) {
    throw new Error("Protected area — validation only, governance approval required");
  }

  switch (action) {
    case "validate": {
      const trigger = (payload?.trigger as Parameters<typeof runFullGlobalUiValidation>[0]) ?? "full-scan";
      const result = runFullGlobalUiValidation(trigger);
      await globalUiIntegrityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            ...result.state,
            dashboard: {
              ...result.state.dashboard,
              enterpriseScore: computeGlobalUiEnterpriseScore({ dashboard: result.state.dashboard, omegaScores: result.state.omegaScores }),
              certificationGranted: result.certificationEligible,
              productionReady: result.certificationEligible,
              launchReady: result.certificationEligible,
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { passPercent: result.passPercent, status: result.status, certificationEligible: result.certificationEligible };
    }
    case "repair": {
      const repair = runGlobalUiAutoRepair(state, state.globalScan.failConditions);
      await globalUiIntegrityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            autoRepairActions: [...repair.executed, ...repair.blocked, ...repair.pending, ...state.autoRepairActions].slice(0, 30),
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { executed: repair.executed.length, blocked: repair.blocked.length, pending: repair.pending.length };
    }
    case "certify": {
      const result = runFullGlobalUiValidation("enterprise-certification");
      if (!result.certificationEligible && state.requirePass100) {
        throw new Error("Global UI Integrity PASS 100% required before certification can be granted");
      }
      await globalUiIntegrityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            ...result.state,
            dashboard: {
              ...result.state.dashboard,
              certificationGranted: true,
              productionReady: true,
              launchReady: true,
              lastCertifiedAt: new Date().toISOString(),
              enterpriseScore: computeGlobalUiEnterpriseScore({ dashboard: result.state.dashboard, omegaScores: result.state.omegaScores }),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { certified: true };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidGlobalUiIntegrityExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getGlobalUiIntegritySnapshot();
      return { data: exportGlobalUiIntegritySnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
