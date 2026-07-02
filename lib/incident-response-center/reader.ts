import type { IncidentSnapshot, IncidentTab } from "@/lib/incident-response-center/types";
import {
  detectIncidentPendingPublish,
  getIncidentDraftDocument,
  getIncidentLiveDocument,
  incidentConfigLifecycle,
} from "@/lib/incident-response-center/config";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import { buildIncidentDashboard, createDefaultIncidentSettings } from "@/lib/incident-response-center/engine";
import {
  activeIncidents,
  criticalIncidents,
  updateIncidentDuration,
} from "@/lib/incident-response-center/incidents";

export async function getIncidentSnapshot(tab: IncidentTab = "dashboard"): Promise<IncidentSnapshot> {
  const live = await getIncidentLiveDocument();
  const draft = await getIncidentDraftDocument();
  const {
    incidents: rawIncidents,
    timeline,
    rootCauseAnalyses,
    postmortems,
    playbooks,
    aiSuggestions,
    automations,
    ...settingsFields
  } = live.settings;
  const settings = { ...createDefaultIncidentSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_incident_center_v1 !== false;
  const incidents = rawIncidents.map(updateIncidentDuration);
  const state = { incidents, timeline, rootCauseAnalyses, postmortems, playbooks, aiSuggestions, automations };
  const dashboard = buildIncidentDashboard(state, settings);
  const history = await incidentConfigLifecycle.getHistory();
  const healthScore = enabled ? (dashboard.activeIncidents === 0 ? 100 : Math.max(40, 100 - dashboard.critical * 15)) : 0;

  return {
    tab,
    dashboard,
    incidents,
    liveIncidents: activeIncidents(incidents),
    criticalIncidents: criticalIncidents(incidents),
    timeline,
    rootCauseAnalyses: flags.ai_analysis_enabled !== false ? rootCauseAnalyses : [],
    postmortems: flags.postmortem_enabled !== false ? postmortems : [],
    playbooks: flags.playbooks_enabled !== false ? playbooks : [],
    aiSuggestions: flags.ai_analysis_enabled !== false ? aiSuggestions : [],
    settings,
    history: history.map((h) => ({
      id: h.id,
      action: "publish",
      actor: h.publishedBy,
      timestamp: h.publishedAt,
    })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectIncidentPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Incident Response Center operational" : "Incident Response Center disabled",
    },
  };
}

export async function getIncidentPageData(tab: IncidentTab = "dashboard") {
  const snapshot = await getIncidentSnapshot(tab);
  return { snapshot, descriptor: INCIDENT_RESPONSE_MODULE_DESCRIPTOR };
}

export function validateIncidentReadiness(snapshot: IncidentSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_incident_center_v1 !== false,
    snapshot.playbooks.length > 0,
    snapshot.health.score >= 40,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
