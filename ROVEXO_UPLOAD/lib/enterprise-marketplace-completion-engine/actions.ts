import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformMarketplaceCompletionAction } from "@/lib/enterprise-marketplace-completion-engine/audit";
import { getMarketplaceCompletionLiveDocument, marketplaceCompletionConfigLifecycle } from "@/lib/enterprise-marketplace-completion-engine/config";
import { executeMarketplaceCompletionConfigAction, isMarketplaceCompletionConfigAction } from "@/lib/enterprise-marketplace-completion-engine/config-actions";
import type { MarketplaceCompletionConfigDocument } from "@/lib/enterprise-marketplace-completion-engine/config";
import { MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR } from "@/lib/enterprise-marketplace-completion-engine/descriptor";
import {
  computeMarketplaceEnterpriseScore,
  isMarketplaceCertificationEligible,
  runFullMarketplaceCompletionValidation,
  runMarketplaceAutoRepair,
} from "@/lib/enterprise-marketplace-completion-engine/engine";
import { resolveContinuousImprovementTrigger } from "@/lib/enterprise-marketplace-completion-engine/continuous-improvement";
import type { ContinuousImprovementTrigger } from "@/lib/enterprise-marketplace-completion-engine/types";
import { isProtectedCompletionRepairTarget } from "@/lib/enterprise-marketplace-completion-engine/repair";
import { exportMarketplaceCompletionSnapshot, isValidMarketplaceCompletionExportFormat } from "@/lib/enterprise-marketplace-completion-engine/export";
import { getMarketplaceCompletionSnapshot } from "@/lib/enterprise-marketplace-completion-engine/reader";

export async function executeMarketplaceCompletionAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isMarketplaceCompletionConfigAction(action)) {
    return executeMarketplaceCompletionConfigAction(action, actorId, payload as { document?: MarketplaceCompletionConfigDocument; historyId?: string });
  }

  const permission = canPerformMarketplaceCompletionAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getMarketplaceCompletionLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({ administrator: actorId, module: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id, action });
  const state = live.settings;

  if (state.validationOnlyMode === false) throw new Error("Validation-only mode must remain enabled");
  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedCompletionRepairTarget(target)) throw new Error("Protected area — governance approval required");

  switch (action) {
    case "validate": {
      const trigger = (payload?.trigger as Parameters<typeof runFullMarketplaceCompletionValidation>[0]) ?? "full-scan";
      const result = runFullMarketplaceCompletionValidation(trigger);
      await marketplaceCompletionConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            ...result.state,
            dashboard: {
              ...result.state.dashboard,
              enterpriseScore: computeMarketplaceEnterpriseScore(result.scan),
              certificationGranted: result.certificationEligible,
              productionReady: result.certificationEligible,
              marketplaceReady: result.certificationEligible,
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { passPercent: result.passPercent, status: result.status, certificationEligible: result.certificationEligible };
    }
    case "repair": {
      const repair = runMarketplaceAutoRepair(state, true);
      await marketplaceCompletionConfigLifecycle.saveDraft(
        { ...live, settings: { ...state, repairActions: [...repair.executed, ...repair.planned, ...state.repairActions].slice(0, 30) }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { executed: repair.executed.length, planned: repair.planned.length };
    }
    case "certify": {
      if (!isMarketplaceCertificationEligible(state.dashboard, state.completionScan) && state.requirePass100) {
        throw new Error("Marketplace certification failed — resolve completion violations before granting certification");
      }
      await marketplaceCompletionConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            dashboard: { ...state.dashboard, certificationGranted: true, productionReady: true, marketplaceReady: true, lastCertifiedAt: new Date().toISOString() },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { certified: true };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidMarketplaceCompletionExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getMarketplaceCompletionSnapshot();
      return { data: exportMarketplaceCompletionSnapshot(snapshot, format) };
    }
    case "continuous-improvement": {
      const trigger = (payload?.trigger as ContinuousImprovementTrigger) ?? "commit";
      const executionTrigger = resolveContinuousImprovementTrigger(trigger);
      const result = runFullMarketplaceCompletionValidation(executionTrigger);
      await marketplaceCompletionConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            ...result.state,
            dashboard: {
              ...result.state.dashboard,
              enterpriseScore: computeMarketplaceEnterpriseScore(result.scan),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { passPercent: result.passPercent, status: result.status, trigger };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
