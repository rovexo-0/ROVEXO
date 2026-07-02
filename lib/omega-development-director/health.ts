import type { DevDirectorSnapshot } from "@/lib/omega-development-director/types";

export function computeDevDirectorHealth(snapshot: Pick<DevDirectorSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings">) {
  if (snapshot.featureFlagsConfig.omega_development_director_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Development Director disabled"] };
  }
  const checks = [
    snapshot.dashboard.developmentProgress >= 80 ? `Development progress ${snapshot.dashboard.developmentProgress}%` : "Development progress below target",
    snapshot.settings.recommendationOnlyMode ? "Recommendation-only mode active" : "WARNING: Direct modification allowed",
    snapshot.health.score >= 50 ? "Director engine responsive" : "Director engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
