import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformObservabilityAction } from "@/lib/enterprise-observability-center/audit";
import { getObservabilityLiveDocument, observabilityConfigLifecycle } from "@/lib/enterprise-observability-center/config";
import { executeObservabilityConfigAction, isObservabilityConfigAction } from "@/lib/enterprise-observability-center/config-actions";
import type { ObservabilityConfigDocument } from "@/lib/enterprise-observability-center/config";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";
import {
  acknowledgeAlert,
  captureTelemetrySnapshot,
  computeAvailability,
  isProtectedMonitoringTarget,
  runDiagnosticsScan,
  runPlatformMonitoring,
  scanAlerts,
  syncOmegaFeed,
} from "@/lib/enterprise-observability-center/engine";
import { exportObservabilitySnapshot, isValidObservabilityExportFormat } from "@/lib/enterprise-observability-center/export";
import { getObservabilitySnapshot } from "@/lib/enterprise-observability-center/reader";

export async function executeObservabilityAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isObservabilityConfigAction(action)) {
    return executeObservabilityConfigAction(action, actorId, payload as { document?: ObservabilityConfigDocument; historyId?: string });
  }

  const permission = canPerformObservabilityAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getObservabilityLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: OBSERVABILITY_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.readOnlyMonitoring === false && ["monitor", "diagnose"].includes(action)) {
    throw new Error("Read-only monitoring must remain enabled — protected subsystems cannot be modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedMonitoringTarget(target)) {
    throw new Error("Protected area — read-only monitoring only, no modifications allowed");
  }

  switch (action) {
    case "monitor": {
      const subsystems = runPlatformMonitoring();
      await observabilityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            subsystems,
            dashboard: {
              ...state.dashboard,
              platformHealth: computeAvailability(subsystems),
              availability: computeAvailability(subsystems),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { subsystemsMonitored: subsystems.length };
    }
    case "telemetry": {
      const telemetry = captureTelemetrySnapshot();
      await observabilityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            telemetry,
            dashboard: { ...state.dashboard, telemetryFreshness: 100 },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { metricsCaptured: telemetry.length };
    }
    case "diagnose": {
      const diagnostics = runDiagnosticsScan();
      await observabilityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, diagnostics: [...diagnostics, ...state.diagnostics].slice(0, 30) },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { diagnosticsRun: diagnostics.length };
    }
    case "alerts": {
      const newAlerts = scanAlerts();
      const alertId = payload?.alertId ? String(payload.alertId) : undefined;
      let alerts = state.alerts;
      if (alertId) {
        alerts = alerts.map((a) => (a.id === alertId ? acknowledgeAlert(a) : a));
      } else {
        alerts = [...newAlerts, ...alerts].slice(0, 30);
      }
      await observabilityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            alerts,
            dashboard: { ...state.dashboard, activeAlerts: alerts.filter((a) => !a.acknowledged && a.status !== "healthy").length },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { alertsProcessed: newAlerts.length, acknowledged: Boolean(alertId) };
    }
    case "sync-omega": {
      const omegaFeed = syncOmegaFeed();
      await observabilityConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            omegaFeed,
            dashboard: { ...state.dashboard, omegaSyncStatus: "healthy" },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { omegaFeedItems: omegaFeed.length };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidObservabilityExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getObservabilitySnapshot();
      return { data: exportObservabilitySnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
