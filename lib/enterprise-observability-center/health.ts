import type { ObservabilitySnapshot } from "@/lib/enterprise-observability-center/types";

export function computeObservabilityHealth(snapshot: Pick<ObservabilitySnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings">) {
  if (snapshot.featureFlagsConfig.enterprise_observability_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Observability Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.platformHealth >= 90 ? `Platform health ${snapshot.dashboard.platformHealth}%` : "Platform health below target",
    snapshot.settings.readOnlyMonitoring ? "Read-only monitoring active" : "WARNING: Direct modification allowed",
    snapshot.dashboard.telemetryFreshness >= 90 ? "Telemetry fresh" : "Telemetry stale",
    snapshot.health.score >= 50 ? "Observability engine responsive" : "Observability engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
