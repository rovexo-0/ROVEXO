import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformOmegaAction } from "@/lib/omega-command-center/audit";
import {
  getOmegaLiveDocument,
  omegaConfigLifecycle,
  runFullEnterpriseScanPipeline,
  startEnterpriseScan,
  buildDefaultDashboard,
} from "@/lib/omega-command-center/config";
import { executeOmegaConfigAction, isOmegaConfigAction } from "@/lib/omega-command-center/config-actions";
import type { OmegaConfigDocument } from "@/lib/omega-command-center/config";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import { computeEnterpriseScore, createExecutiveReport } from "@/lib/omega-command-center/orchestrator";
import { exportOmegaSnapshot, isValidOmegaExportFormat } from "@/lib/omega-command-center/export";
import { getOmegaSnapshot } from "@/lib/omega-command-center/reader";
import type { OmegaScanType } from "@/lib/omega-command-center/types";

export async function executeOmegaAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isOmegaConfigAction(action)) {
    return executeOmegaConfigAction(action, actorId, payload as { document?: OmegaConfigDocument; historyId?: string });
  }

  const permission = canPerformOmegaAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getOmegaLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id,
    action,
  });

  const {
    enterpriseScore,
    healthCards,
    engineStates,
    activeScan,
    recommendations,
    executiveReport,
    timeline,
    liveMonitor,
    ...settingsFields
  } = live.settings;

  const dashboard = { enterpriseScore, healthCards, engineStates, activeScan, recommendations, executiveReport, timeline, liveMonitor };

  switch (action) {
    case "run-scan":
    case "quick-scan":
    case "deep-scan": {
      const scanType: OmegaScanType =
        action === "quick-scan" ? "quick" : action === "deep-scan" ? "deep" : "enterprise";
      const result = scanType === "enterprise" ? runFullEnterpriseScanPipeline() : { progress: startEnterpriseScan(scanType), timeline: dashboard.timeline, engines: dashboard.engineStates };
      const newScore = computeEnterpriseScore(dashboard.healthCards);
      await omegaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...live.settings,
            activeScan: result.progress,
            engineStates: result.engines,
            timeline: [...result.timeline, ...dashboard.timeline].slice(0, 50),
            executiveReport: createExecutiveReport(newScore),
            enterpriseScore: newScore,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { scanId: result.progress.scanId };
    }
    case "pause": {
      if (!dashboard.activeScan) throw new Error("No active scan");
      await omegaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...live.settings, activeScan: { ...dashboard.activeScan, status: "paused" } },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { paused: true };
    }
    case "resume": {
      if (!dashboard.activeScan) throw new Error("No active scan");
      await omegaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...live.settings, activeScan: { ...dashboard.activeScan, status: "running" } },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { resumed: true };
    }
    case "cancel": {
      await omegaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...live.settings,
            activeScan: dashboard.activeScan ? { ...dashboard.activeScan, status: "cancelled", completedAt: new Date().toISOString() } : undefined,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { cancelled: true };
    }
    case "repair": {
      const recId = String(payload?.recommendationId ?? dashboard.recommendations[0]?.id ?? "");
      const updated = dashboard.recommendations.filter((r) => r.id !== recId);
      await omegaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...live.settings, recommendations: updated },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { repaired: true, recommendationId: recId };
    }
    case "deploy":
    case "rollback": {
      await omegaConfigLifecycle.saveDraft(
        { ...live, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { [action]: true };
    }
    case "report": {
      const score = computeEnterpriseScore(dashboard.healthCards);
      const report = createExecutiveReport(score);
      await omegaConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, executiveReport: report, enterpriseScore: score }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { report };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidOmegaExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getOmegaSnapshot();
      return { data: exportOmegaSnapshot(snapshot, format) };
    }
    case "refresh": {
      const refreshed = buildDefaultDashboard();
      await omegaConfigLifecycle.saveDraft(
        { ...live, settings: { ...settingsFields, ...refreshed }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { refreshed: true };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
