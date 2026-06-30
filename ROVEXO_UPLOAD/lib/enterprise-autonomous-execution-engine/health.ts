import type { ExecutionEngineSnapshot } from "@/lib/enterprise-autonomous-execution-engine/types";

export function computeExecutionEngineHealth(snapshot: Pick<ExecutionEngineSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings">) {
  if (snapshot.featureFlagsConfig.enterprise_autonomous_execution_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Execution Engine disabled"] };
  }
  const checks = [
    snapshot.dashboard.platformReadiness >= 90 ? `Platform readiness ${snapshot.dashboard.platformReadiness}%` : "Platform readiness below target",
    snapshot.settings.neverBypassProtectedAreas ? "Protected areas enforced" : "WARNING: Protected area bypass allowed",
    snapshot.settings.approvalGatesEnforced ? "Approval gates active" : "WARNING: Approval gates disabled",
    snapshot.health.score >= 50 ? "Execution engine responsive" : "Execution engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
