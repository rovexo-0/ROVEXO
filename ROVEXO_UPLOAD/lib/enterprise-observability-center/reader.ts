import type { ObservabilitySnapshot, ObservabilityTab } from "@/lib/enterprise-observability-center/types";
import {
  detectObservabilityPendingPublish,
  getObservabilityDraftDocument,
  getObservabilityLiveDocument,
  observabilityConfigLifecycle,
} from "@/lib/enterprise-observability-center/config";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";
import { computeObservabilityEnterpriseScore, createDefaultObservabilitySettings } from "@/lib/enterprise-observability-center/engine";

export async function getObservabilitySnapshot(tab: ObservabilityTab = "dashboard"): Promise<ObservabilitySnapshot> {
  const live = await getObservabilityLiveDocument();
  const draft = await getObservabilityDraftDocument();
  const {
    dashboard,
    healthMetrics,
    subsystems,
    telemetry,
    alerts,
    topology,
    diagnostics,
    timeline,
    capacityForecasts,
    omegaFeed,
    reports,
    auditEntries,
    liveMonitoringEnabled,
    telemetryCaptureEnabled,
    alertEngineEnabled,
    readOnlyMonitoring,
    syncWithOmega,
    syncWithIncidentResponse,
  } = live.settings;
  const settings = {
    ...createDefaultObservabilitySettings(),
    liveMonitoringEnabled,
    telemetryCaptureEnabled,
    alertEngineEnabled,
    readOnlyMonitoring: readOnlyMonitoring ?? true,
    syncWithOmega,
    syncWithIncidentResponse,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_observability_center_v1 !== false;
  const enterpriseScore = enabled ? computeObservabilityEnterpriseScore({ dashboard, healthMetrics }) : 0;
  const history = await observabilityConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, platformHealth: 0, enterpriseScore: 0 },
    healthMetrics: enabled ? healthMetrics : [],
    subsystems: flags.live_monitoring_enabled !== false ? subsystems : [],
    telemetry: flags.telemetry_capture_enabled !== false ? telemetry : [],
    alerts: flags.alert_engine_enabled !== false ? alerts : [],
    topology: flags.topology_map_enabled !== false ? topology : [],
    diagnostics: flags.diagnostics_engine_enabled !== false ? diagnostics : [],
    timeline,
    capacityForecasts: flags.capacity_planning_enabled !== false ? capacityForecasts : [],
    omegaFeed: flags.omega_integration_enabled !== false ? omegaFeed : [],
    reports,
    auditEntries,
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
    pendingPublish: detectObservabilityPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 95 ? "healthy" : enterpriseScore >= 80 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Enterprise Observability Center operational — read-only monitoring" : "Observability Center disabled",
    },
  };
}

export async function getObservabilityPageData(tab: ObservabilityTab = "dashboard") {
  const snapshot = await getObservabilitySnapshot(tab);
  return { snapshot, descriptor: OBSERVABILITY_MODULE_DESCRIPTOR };
}

export function validateObservabilityReadiness(snapshot: ObservabilitySnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_observability_center_v1 !== false,
    snapshot.settings.readOnlyMonitoring === true,
    snapshot.dashboard.platformHealth >= 90,
    snapshot.omegaFeed.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
