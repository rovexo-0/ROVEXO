import { fetchIncidentLiveContext } from "@/lib/incident-command-center-engine/live";
import {
  createDefaultPushChannels,
  getIncidentCommandSettings,
  getIncidentHistory,
  getIncidentReports,
  getIncidentStateOverrides,
} from "@/lib/incident-command-center-engine/engine";
import {
  assembleLiveIncidents,
  buildIncidentAnalytics,
  buildIncidentDashboard,
  buildIncidentOriAnalyses,
  filterIncidentsByTab,
} from "@/lib/incident-command-center-engine/timeline";
import type { IncidentCommandSnapshot, IncidentCommandTab } from "@/lib/incident-command-center-engine/types";

export async function getIncidentCommandSnapshot(tab: IncidentCommandTab = "dashboard"): Promise<IncidentCommandSnapshot> {
  const [ctx, overrides, settings, reports, history] = await Promise.all([
    fetchIncidentLiveContext(),
    getIncidentStateOverrides(),
    getIncidentCommandSettings(),
    getIncidentReports(),
    getIncidentHistory(),
  ]);

  const incidents = assembleLiveIncidents(ctx, overrides);
  const dashboard = buildIncidentDashboard(incidents, ctx.resolvedTodayCount);
  const filteredIncidents = tab === "dashboard" || tab === "live" || tab === "history" || tab === "emergency" || tab === "reports" || tab === "settings"
    ? incidents
    : filterIncidentsByTab(incidents, tab);

  return {
    scannedAt: new Date().toISOString(),
    dashboard,
    incidents,
    filteredIncidents,
    oriAnalyses: buildIncidentOriAnalyses(incidents),
    analytics: buildIncidentAnalytics(incidents, ctx),
    pushChannels: createDefaultPushChannels(),
    settings,
    reports,
    history,
    integrations: {
      omega: true,
      guardianEnterpriseX: true,
      sentinelX: true,
      antivirusEngineX: true,
      ori: true,
      infrastructureEngine: true,
      disasterRecoveryEngine: true,
      enterpriseComplianceCenter: true,
      certificationCenter: true,
      executiveCommandCenter: true,
      rovexoTrust: true,
    },
  };
}

export async function getIncidentCommandPageData(tab: IncidentCommandTab = "dashboard") {
  const snapshot = await getIncidentCommandSnapshot(tab);
  return { snapshot };
}
