import type { AiSuggestion, IncidentRecord } from "@/lib/incident-response-center/types";
import { AI_INTEGRATION_SOURCES } from "@/lib/incident-response-center/registry";

export function generateIncidentAiSuggestions(incidents: IncidentRecord[]): AiSuggestion[] {
  const active = incidents.filter((i) => i.status !== "resolved");
  const suggestions: AiSuggestion[] = [];

  for (const incident of active) {
    suggestions.push({
      id: `scan-${incident.id}`,
      source: "scan",
      type: "anomaly",
      summary: `SCAN detected anomaly in ${incident.affectedService}: ${incident.title}`,
      confidence: incident.priority === "critical" ? 92 : 78,
      incidentId: incident.id,
    });
    suggestions.push({
      id: `sentinel-${incident.id}`,
      source: "sentinel",
      type: "threat",
      summary: `SENTINEL threat assessment for ${incident.category} incident ${incident.id}`,
      confidence: 85,
      incidentId: incident.id,
    });
    suggestions.push({
      id: `omega-${incident.id}`,
      source: "omega",
      type: "repair",
      summary: `OMEGA recommends automated repair for ${incident.affectedService}`,
      confidence: 88,
      incidentId: incident.id,
    });
  }

  if (active.length > 2) {
    suggestions.push({
      id: "omega-predict-1",
      source: "omega",
      type: "prediction",
      summary: "OMEGA predicts cascading failure risk if payment incident unresolved within 30 minutes",
      confidence: 72,
    });
    suggestions.push({
      id: "omega-maint-1",
      source: "omega",
      type: "maintenance",
      summary: "Preventive maintenance recommended for database connection pool",
      confidence: 65,
    });
  }

  return suggestions;
}

export function scanAnomalyCount(suggestions: AiSuggestion[]): number {
  return suggestions.filter((s) => s.source === "scan" && s.type === "anomaly").length;
}

export function sentinelThreatCount(suggestions: AiSuggestion[]): number {
  return suggestions.filter((s) => s.source === "sentinel" && s.type === "threat").length;
}

export function omegaRepairCount(suggestions: AiSuggestion[]): number {
  return suggestions.filter((s) => s.source === "omega" && (s.type === "repair" || s.type === "maintenance")).length;
}

export function allAiSourcesPresent(suggestions: AiSuggestion[]): boolean {
  return AI_INTEGRATION_SOURCES.every((source) => suggestions.some((s) => s.source === source));
}
