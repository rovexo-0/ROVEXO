import type { IncidentSnapshot } from "@/lib/incident-response-center/types";

export function computeIncidentHealth(snapshot: Pick<IncidentSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.enterprise_incident_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Incident Response Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.critical === 0 ? "No critical incidents" : `${snapshot.dashboard.critical} critical incident(s)`,
    snapshot.dashboard.emergencyMode ? "Emergency mode active" : "Normal operations",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks,
  };
}
