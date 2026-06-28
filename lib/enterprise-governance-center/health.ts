import type { GovernanceSnapshot } from "@/lib/enterprise-governance-center/types";

export function computeGovernanceHealth(snapshot: Pick<GovernanceSnapshot, "health" | "featureFlagsConfig" | "overallScore">) {
  if (snapshot.featureFlagsConfig.enterprise_governance_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Governance Center disabled"] };
  }
  const checks = [
    snapshot.overallScore >= 95 ? `Enterprise score ${snapshot.overallScore}%` : "Enterprise score below target",
    snapshot.health.score >= 50 ? "Governance engine responsive" : "Governance engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
