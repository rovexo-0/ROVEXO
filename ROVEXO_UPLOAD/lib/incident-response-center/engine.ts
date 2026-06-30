import type { IncidentDashboard, IncidentSettings, IncidentState } from "@/lib/incident-response-center/types";
import {
  activeIncidents,
  averageResolutionMinutes,
  createDefaultIncidents,
  resolvedToday,
  severityCounts,
  updateIncidentDuration,
} from "@/lib/incident-response-center/incidents";
import { createDefaultPlaybooks } from "@/lib/incident-response-center/playbooks";
import { analyzeRootCause } from "@/lib/incident-response-center/root-cause";
import { generatePostmortem } from "@/lib/incident-response-center/postmortem";
import { createDefaultTimelineEvents } from "@/lib/incident-response-center/timeline";
import { createDefaultAutomations, suggestRollback } from "@/lib/incident-response-center/automations";
import { generateIncidentAiSuggestions } from "@/lib/incident-response-center/ai-integration";

export function createDefaultIncidentSettings(): IncidentSettings {
  return {
    emergencyMode: false,
    autoAssignEnabled: true,
    autoEscalateEnabled: true,
    autoNotifyEnabled: true,
    autoRecoverEnabled: false,
    mfaRequired: true,
    defaultOwner: "on-call-engineer",
    escalationThresholdMinutes: 30,
  };
}

export function createDefaultIncidentState(): IncidentState {
  const incidents = createDefaultIncidents().map(updateIncidentDuration);
  const timeline = createDefaultTimelineEvents(incidents);
  const rootCauseAnalyses = incidents
    .filter((i) => i.status !== "resolved")
    .slice(0, 3)
    .map(analyzeRootCause);
  const postmortems = incidents
    .filter((i) => i.status === "resolved")
    .map((i) => generatePostmortem(i, rootCauseAnalyses.find((r) => r.incidentId === i.id)));

  return {
    incidents,
    timeline,
    rootCauseAnalyses,
    postmortems,
    playbooks: createDefaultPlaybooks(),
    aiSuggestions: generateIncidentAiSuggestions(incidents),
    automations: createDefaultAutomations(),
  };
}

export function buildIncidentDashboard(state: IncidentState, settings: IncidentSettings): IncidentDashboard {
  const active = activeIncidents(state.incidents);
  const counts = severityCounts(state.incidents);
  const rollbackCandidates = active.filter(suggestRollback).length;

  return {
    activeIncidents: active.length,
    critical: counts.critical,
    major: counts.major,
    minor: counts.minor,
    resolvedToday: resolvedToday(state.incidents).length,
    averageResolutionMinutes: averageResolutionMinutes(state.incidents),
    openAlerts: active.filter((i) => ["open", "acknowledged"].includes(i.status)).length,
    emergencyMode: settings.emergencyMode,
    aiSuggestions: state.aiSuggestions.length,
    recoveryQueue: active.filter((i) => ["mitigating", "investigating"].includes(i.status)).length,
    deploymentsBlocked: active.filter((i) => i.category === "deployment").length,
    rollbackCandidates,
  };
}
