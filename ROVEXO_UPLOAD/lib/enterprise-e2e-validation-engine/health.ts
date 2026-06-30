import type { E2eValidationSnapshot } from "@/lib/enterprise-e2e-validation-engine/types";

export function computeE2eValidationHealth(snapshot: Pick<E2eValidationSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings">) {
  if (snapshot.featureFlagsConfig.enterprise_e2e_validation_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["E2E Validation Engine disabled"] };
  }
  const checks = [
    snapshot.dashboard.overallPassRate >= 90 ? `Pass rate ${snapshot.dashboard.overallPassRate}%` : "Pass rate below target",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Auto-modification allowed",
    snapshot.dashboard.openFailures <= 10 ? `Open failures: ${snapshot.dashboard.openFailures}` : "Too many open failures",
    snapshot.health.score >= 50 ? "Validation engine responsive" : "Validation engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
