import type { AutomationSnapshot } from "@/lib/enterprise-automation-hub/types";

export function computeAutomationHealth(snapshot: Pick<AutomationSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.enterprise_automation_hub_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Automation Hub disabled"] };
  }
  const checks = [
    snapshot.dashboard.automationHealth >= 80 ? "Automation health strong" : "Automation health needs attention",
    snapshot.dashboard.successRate >= 90 ? `Success rate ${snapshot.dashboard.successRate}%` : "Elevated failure rate",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
