import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformAiOsAction } from "@/lib/enterprise-ai-operating-system/audit";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import { getAiOsLiveDocument, aiOsConfigLifecycle } from "@/lib/enterprise-ai-operating-system/config";
import { executeAiOsConfigAction, isAiOsConfigAction } from "@/lib/enterprise-ai-operating-system/config-actions";
import type { AiOsConfigDocument } from "@/lib/enterprise-ai-operating-system/config";
import { runOmegaAnalysis } from "@/lib/enterprise-ai-operating-system/omega";
import { generateAllPredictions } from "@/lib/enterprise-ai-operating-system/predictions";
import { isValidScanMode, runScan } from "@/lib/enterprise-ai-operating-system/scan";
import {
  approveRepair,
  cancelRepair,
  createRepairPlan,
} from "@/lib/enterprise-ai-operating-system/self-healing";
import type { SelfHealingIssueType } from "@/lib/enterprise-ai-operating-system/types";

export async function executeAiOsAction(
  action: string,
  actorId: string,
  payload?: Record<string, unknown>,
) {
  if (isAiOsConfigAction(action)) {
    return executeAiOsConfigAction(action, actorId, payload as { document?: AiOsConfigDocument; historyId?: string });
  }

  const permission = canPerformAiOsAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getAiOsLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id,
    action,
  });

  switch (action) {
    case "run-scan": {
      const mode = String(payload?.mode ?? "quick");
      if (!isValidScanMode(mode)) throw new Error("Invalid scan mode");
      const report = runScan(mode);
      const next = {
        ...live,
        settings: { ...live.settings, scans: [report, ...live.settings.scans].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await aiOsConfigLifecycle.saveDraft(next, actorId);
      return { scan: report };
    }
    case "run-analysis": {
      const analysis = runOmegaAnalysis(live.settings.scans, live.settings.alerts);
      const next = {
        ...live,
        settings: {
          ...live.settings,
          recommendations: analysis.recommendations,
          predictions: generateAllPredictions().slice(0, 13),
        },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await aiOsConfigLifecycle.saveDraft(next, actorId);
      return { analysis };
    }
    case "create-repair-plan": {
      const issueType = String(payload?.issueType ?? "configuration-drift") as SelfHealingIssueType;
      const plan = createRepairPlan(issueType, live.settings.approvalRequiredForRepairs);
      const next = {
        ...live,
        settings: { ...live.settings, repairs: [plan, ...live.settings.repairs].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await aiOsConfigLifecycle.saveDraft(next, actorId);
      return { repair: plan };
    }
    case "approve-repair": {
      const repairId = String(payload?.repairId ?? "");
      const repairs = live.settings.repairs.map((p) =>
        p.id === repairId ? approveRepair(p, actorId) : p,
      );
      const next = {
        ...live,
        settings: { ...live.settings, repairs },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await aiOsConfigLifecycle.saveDraft(next, actorId);
      return { repair: repairs.find((p) => p.id === repairId) };
    }
    case "cancel-repair": {
      const repairId = String(payload?.repairId ?? "");
      const repairs = live.settings.repairs.map((p) =>
        p.id === repairId ? cancelRepair(p) : p,
      );
      const next = {
        ...live,
        settings: { ...live.settings, repairs },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await aiOsConfigLifecycle.saveDraft(next, actorId);
      return { repair: repairs.find((p) => p.id === repairId) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
