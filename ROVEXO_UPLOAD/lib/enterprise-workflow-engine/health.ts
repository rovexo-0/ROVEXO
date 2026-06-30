import type { WorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/types";

export function computeWorkflowEngineHealth(snapshot: Pick<WorkflowEngineSnapshot, "health" | "featureFlags" | "dashboard">) {
  if (snapshot.featureFlags.workflow_engine_enabled === false) {
    return { status: "failed" as const, score: 0, checks: ["Engine disabled"] };
  }
  const checks = [
    snapshot.dashboard.totalWorkflows > 0 ? "Workflows registered" : "No workflows",
    snapshot.dashboard.healthScore >= 50 ? "Health acceptable" : "Low health score",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks,
  };
}
