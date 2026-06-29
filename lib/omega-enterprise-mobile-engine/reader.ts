import {
  createDefaultOmegaEnterpriseIntegrations,
  createDefaultOmegaNotifications,
  createDefaultOmegaOriInsights,
} from "@/lib/omega-enterprise-mobile-engine/defaults";
import {
  getOmegaAlerts,
  getOmegaEnterpriseSettings,
  getOmegaMetricsPayload,
  getOmegaReports,
  getOmegaScanHistory,
} from "@/lib/omega-enterprise-mobile-engine/engine";
import {
  buildOmegaEnterpriseDashboard,
  buildOriInsightsFromState,
  computeOmegaGoldScore,
} from "@/lib/omega-enterprise-mobile-engine/timeline";
import type { OmegaEnterpriseEngineSnapshot } from "@/lib/omega-enterprise-mobile-engine/types";

export async function getOmegaEnterpriseMobileSnapshot(): Promise<OmegaEnterpriseEngineSnapshot> {
  const [metrics, alerts, scans, reports, settings] = await Promise.all([
    getOmegaMetricsPayload(),
    getOmegaAlerts(),
    getOmegaScanHistory(),
    getOmegaReports(),
    getOmegaEnterpriseSettings(),
  ]);

  const latestScan = scans[0] ?? null;
  const dashboard = buildOmegaEnterpriseDashboard({
    globalHealth: metrics.globalHealth,
    liveModules: metrics.liveModules,
    systemStatus: metrics.systemStatus,
    alerts,
    latestScan,
    performanceScore: metrics.performance.performanceScore,
  });

  const certificationsPassCount = metrics.certifications.filter((c) => c.status === "pass").length;
  const oriBase = createDefaultOmegaOriInsights();
  const oriLive = buildOriInsightsFromState({
    globalHealth: metrics.globalHealth,
    alerts,
    performance: metrics.performance,
  });

  return {
    scannedAt: new Date().toISOString(),
    dashboard,
    alerts,
    scans,
    latestScan,
    release: metrics.release,
    certifications: metrics.certifications,
    infrastructure: metrics.infrastructure,
    performance: metrics.performance,
    security: metrics.security,
    analytics: metrics.analytics,
    oriInsights: [...oriLive, ...oriBase].slice(0, 8),
    reports,
    notifications: createDefaultOmegaNotifications(),
    settings,
    integrations: createDefaultOmegaEnterpriseIntegrations(),
    omegaGoldScore: computeOmegaGoldScore(metrics.globalHealth, certificationsPassCount, metrics.certifications.length),
  };
}

export async function getOmegaEnterpriseMobilePageData() {
  const snapshot = await getOmegaEnterpriseMobileSnapshot();
  return { snapshot };
}
