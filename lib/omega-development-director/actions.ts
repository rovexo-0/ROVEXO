import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformDevDirectorAction } from "@/lib/omega-development-director/audit";
import { getDevDirectorLiveDocument, devDirectorConfigLifecycle } from "@/lib/omega-development-director/config";
import { executeDevDirectorConfigAction, isDevDirectorConfigAction } from "@/lib/omega-development-director/config-actions";
import type { DevDirectorConfigDocument } from "@/lib/omega-development-director/config";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";
import {
  advanceRepairProposal,
  generateRepairProposal,
  isProtectedTarget,
  prioritizeRoadmap,
  runCodebaseAnalysis,
  runDiscoveryScan,
} from "@/lib/omega-development-director/engine";
import { exportDevDirectorSnapshot, isValidDevDirectorExportFormat } from "@/lib/omega-development-director/export";
import { getDevDirectorSnapshot } from "@/lib/omega-development-director/reader";

export async function executeDevDirectorAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isDevDirectorConfigAction(action)) {
    return executeDevDirectorConfigAction(action, actorId, payload as { document?: DevDirectorConfigDocument; historyId?: string });
  }

  const permission = canPerformDevDirectorAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getDevDirectorLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.recommendationOnlyMode === false && action === "repair") {
    throw new Error("Recommendation-only mode must remain enabled — production cannot be modified directly");
  }

  switch (action) {
    case "analyze": {
      const analysis = runCodebaseAnalysis();
      await devDirectorConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            codeAnalysis: analysis,
            dashboard: { ...state.dashboard, developmentProgress: Math.min(100, state.dashboard.developmentProgress + 0.5) },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { domainsAnalyzed: analysis.length };
    }
    case "discover": {
      const findings = runDiscoveryScan();
      await devDirectorConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            discoveries: [...findings, ...state.discoveries].slice(0, 40),
            dashboard: { ...state.dashboard, openFindings: state.dashboard.openFindings + findings.length },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { findingsDiscovered: findings.length };
    }
    case "prioritize": {
      const roadmap = prioritizeRoadmap(state.roadmap);
      await devDirectorConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, roadmap },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { itemsPrioritized: roadmap.length };
    }
    case "repair": {
      const issue = String(payload?.issue ?? "Platform issue detected");
      const target = payload?.target ? String(payload.target) : undefined;
      if (isProtectedTarget(issue) || (target && isProtectedTarget(target))) {
        const blocked = generateRepairProposal(issue, target);
        await devDirectorConfigLifecycle.saveDraft(
          {
            ...live,
            settings: {
              ...state,
              repairProposals: [blocked, ...state.repairProposals].slice(0, 20),
            },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { fixId: blocked.id, blocked: true, reason: "Protected area — recommendation only" };
      }
      const existingId = payload?.repairId ? String(payload.repairId) : undefined;
      if (existingId) {
        const updated = state.repairProposals.map((p) => (p.id === existingId ? advanceRepairProposal(p) : p));
        await devDirectorConfigLifecycle.saveDraft(
          {
            ...live,
            settings: { ...state, repairProposals: updated },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { repairId: existingId, advanced: true };
      }
      const proposal = generateRepairProposal(issue, target);
      await devDirectorConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            repairProposals: [proposal, ...state.repairProposals].slice(0, 20),
            dashboard: { ...state.dashboard, repairQueue: state.dashboard.repairQueue + 1 },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { repairId: proposal.id, blocked: false };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidDevDirectorExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getDevDirectorSnapshot();
      return { data: exportDevDirectorSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
