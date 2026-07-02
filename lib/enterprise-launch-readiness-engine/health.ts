import type { LaunchReadinessSnapshot } from "@/lib/enterprise-launch-readiness-engine/types";

export function computeLaunchReadinessHealth(
  snapshot: Pick<LaunchReadinessSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings" | "blockers" | "launchScan">,
) {
  if (snapshot.featureFlagsConfig.enterprise_launch_readiness_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Launch Readiness Engine disabled"] };
  }
  const activeBlockers = snapshot.blockers.filter((b) => b.active).length;
  const checks = [
    snapshot.dashboard.overallPassPercent >= 100 ? `Overall PASS ${snapshot.dashboard.overallPassPercent}%` : "Overall PASS below 100%",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Validation-only mode disabled",
    snapshot.dashboard.launchReady ? "Launch Ready" : "Launch pending",
    snapshot.dashboard.productionReady ? "Production Ready" : "Production readiness pending",
    activeBlockers === 0 ? "No active launch blockers" : `${activeBlockers} active launch blocker(s)`,
    snapshot.launchScan.productionGates.every((g) => g.status === "pass") ? "All production gates PASS" : "Production gates pending",
    snapshot.health.score >= 95 ? "Launch readiness engine healthy" : "Launch readiness degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
