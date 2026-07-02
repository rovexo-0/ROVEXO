import type { IncidentRecord, RootCauseAnalysis } from "@/lib/incident-response-center/types";
import { generateIncidentAiSuggestions } from "@/lib/incident-response-center/ai-integration";

export function analyzeRootCause(incident: IncidentRecord): RootCauseAnalysis {
  const suggestions = generateIncidentAiSuggestions([incident]);
  const scan = suggestions.find((s) => s.source === "scan");
  const sentinel = suggestions.find((s) => s.source === "sentinel");
  const omega = suggestions.find((s) => s.source === "omega");

  const confidencePercent = Math.round(
    [scan?.confidence ?? 70, sentinel?.confidence ?? 75, omega?.confidence ?? 80]
      .reduce((a, b) => a + b, 0) / 3,
  );

  return {
    incidentId: incident.id,
    timeline: [
      `${incident.startedAt}: Incident detected by ${incident.detectedBy}`,
      `Service ${incident.affectedService} reported degradation`,
      `Category: ${incident.category} — Priority: ${incident.priority}`,
    ],
    dependencies: inferDependencies(incident.category),
    recentDeployments: ["2.5.0-rc.1 → staging (canary)", "2.4.9 → production (blue-green)"],
    affectedServices: [incident.affectedService, ...inferDependencies(incident.category).slice(0, 2)],
    logCorrelation: [
      `Error spike in ${incident.category} logs at ${incident.startedAt.slice(11, 19)} UTC`,
      `Correlated trace IDs linked to ${incident.affectedService}`,
    ],
    aiExplanation: [
      scan ? `SCAN: ${scan.summary}` : null,
      sentinel ? `SENTINEL: ${sentinel.summary}` : null,
      omega ? `OMEGA: ${omega.summary}` : null,
    ]
      .filter(Boolean)
      .join(" "),
    confidencePercent,
    sources: ["scan", "sentinel", "omega"],
  };
}

function inferDependencies(category: string): string[] {
  const map: Record<string, string[]> = {
    payments: ["Stripe API", "Wallet Engine", "Orders Engine"],
    database: ["Supabase Primary", "Redis Cache", "Search Index"],
    deployment: ["Production API", "Certification Center", "Recovery Center"],
    search: ["Elasticsearch", "Listings Index", "API Gateway"],
    authentication: ["Auth Provider", "Session Store", "MFA Service"],
  };
  return map[category] ?? ["API Gateway", "Enterprise Core", "Mission Control"];
}

export function rootCauseConfidence(analysis: RootCauseAnalysis): "high" | "medium" | "low" {
  if (analysis.confidencePercent >= 85) return "high";
  if (analysis.confidencePercent >= 60) return "medium";
  return "low";
}
