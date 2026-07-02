import {
  assembleTimelineEntries,
  buildOriTimelineAnalysis,
  buildTimelineStats,
  filterTimelineEntries,
  verifyOmegaTimelineIntegrity,
} from "@/lib/incident-timeline-engine/builder";
import {
  getIncidentTimelineExports,
  getIncidentTimelineSettings,
  getPersistedTimelineRecords,
} from "@/lib/incident-timeline-engine/engine";
import { fetchIncidentTimelineLiveContext } from "@/lib/incident-timeline-engine/live";
import type { IncidentTimelineFilters, IncidentTimelineTab } from "@/lib/incident-timeline-engine/types";

function tabFilters(tab: IncidentTimelineTab, filters: IncidentTimelineFilters): IncidentTimelineFilters {
  if (tab === "history") return { ...filters, resolutionState: filters.resolutionState ?? "resolved" };
  if (tab === "live") return { ...filters, resolutionState: filters.resolutionState ?? "open" };
  return filters;
}

export async function getIncidentTimelineSnapshot(
  tab: IncidentTimelineTab = "live",
  filters: IncidentTimelineFilters = {},
) {
  const [ctx, persisted, settings, exports] = await Promise.all([
    fetchIncidentTimelineLiveContext(),
    getPersistedTimelineRecords(),
    getIncidentTimelineSettings(),
    getIncidentTimelineExports(),
  ]);

  const entries = assembleTimelineEntries(ctx, persisted);
  const appliedFilters = tabFilters(tab, filters);
  const filteredEntries =
    tab === "search" || tab === "export"
      ? filterTimelineEntries(entries, appliedFilters)
      : tab === "history"
        ? filterTimelineEntries(entries, { ...appliedFilters, resolutionState: "resolved" })
        : tab === "live"
          ? entries.filter((e) => !e.resolution?.resolved && e.status !== "closed")
          : entries;

  const omegaIntegrity = verifyOmegaTimelineIntegrity(entries, ctx);

  return {
    scannedAt: new Date().toISOString(),
    entries,
    filteredEntries,
    oriAnalysis: buildOriTimelineAnalysis(entries),
    omegaIntegrity,
    exports,
    settings,
    stats: buildTimelineStats(entries),
    integrations: {
      omega: true,
      guardianEnterpriseX: true,
      sentinelX: true,
      antivirusEngineX: true,
      ori: true,
      infrastructureEngine: true,
      disasterRecoveryEngine: true,
      incidentCommandCenter: true,
      executiveCommandCenter: true,
      rovexoTrust: true,
    },
  };
}

export async function getIncidentTimelinePageData(tab: IncidentTimelineTab = "live", filters: IncidentTimelineFilters = {}) {
  const snapshot = await getIncidentTimelineSnapshot(tab, filters);
  return { snapshot };
}
