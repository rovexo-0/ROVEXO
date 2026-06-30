import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformLaunchReadinessAction } from "@/lib/enterprise-launch-readiness-engine/audit";
import { getLaunchReadinessLiveDocument, launchReadinessConfigLifecycle } from "@/lib/enterprise-launch-readiness-engine/config";
import { executeLaunchReadinessConfigAction, isLaunchReadinessConfigAction } from "@/lib/enterprise-launch-readiness-engine/config-actions";
import type { LaunchReadinessConfigDocument } from "@/lib/enterprise-launch-readiness-engine/config";
import { LAUNCH_READINESS_MODULE_DESCRIPTOR } from "@/lib/enterprise-launch-readiness-engine/descriptor";
import {
  computeLaunchEnterpriseScore,
  isLaunchCertificationEligible,
  runFullLaunchReadinessValidation,
  runLaunchAutoRepair,
} from "@/lib/enterprise-launch-readiness-engine/engine";
import { isProtectedLaunchRepairTarget } from "@/lib/enterprise-launch-readiness-engine/repair";
import { exportLaunchReadinessSnapshot, isValidLaunchReadinessExportFormat } from "@/lib/enterprise-launch-readiness-engine/export";
import { getLaunchReadinessSnapshot } from "@/lib/enterprise-launch-readiness-engine/reader";

export async function executeLaunchReadinessAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isLaunchReadinessConfigAction(action)) {
    return executeLaunchReadinessConfigAction(action, actorId, payload as { document?: LaunchReadinessConfigDocument; historyId?: string });
  }

  const permission = canPerformLaunchReadinessAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getLaunchReadinessLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: LAUNCH_READINESS_MODULE_DESCRIPTOR.id,
    action,
  });
  const state = live.settings;

  if (state.validationOnlyMode === false) {
    throw new Error("Validation-only mode must remain enabled — protected areas cannot be auto-modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedLaunchRepairTarget(target)) {
    throw new Error("Protected area — validation only, governance approval required");
  }

  switch (action) {
    case "validate": {
      const trigger = (payload?.trigger as Parameters<typeof runFullLaunchReadinessValidation>[0]) ?? "full-scan";
      const result = runFullLaunchReadinessValidation(trigger);
      await launchReadinessConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            ...result.state,
            dashboard: {
              ...result.state.dashboard,
              enterpriseScore: computeLaunchEnterpriseScore(result.scan),
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
      const repair = runLaunchAutoRepair(state, true);
      await launchReadinessConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            repairActions: [...repair.executed, ...repair.planned, ...state.repairActions].slice(0, 30),
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { executed: repair.executed.length, planned: repair.planned.length };
    }
    case "certify": {
      if (!isLaunchCertificationEligible(state.dashboard, state.launchScan) && state.requirePass100) {
        throw new Error("Launch readiness certification failed — resolve blockers before granting launch certification");
      }
      await launchReadinessConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            dashboard: {
              ...state.dashboard,
              certificationGranted: true,
              productionReady: true,
              launchReady: true,
              lastCertifiedAt: new Date().toISOString(),
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
      if (!isValidLaunchReadinessExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getLaunchReadinessSnapshot();
      return { data: exportLaunchReadinessSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
