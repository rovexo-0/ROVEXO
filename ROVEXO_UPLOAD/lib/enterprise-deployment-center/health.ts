import type { DeploymentSnapshot } from "@/lib/enterprise-deployment-center/types";

export function computeDeploymentHealth(snapshot: Pick<DeploymentSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.deployment_center_enabled === false) {
    return { status: "failed" as const, score: 0, checks: ["Deployment Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.certificationStatus !== "failed" ? "Certification ok" : "Certification failed",
    snapshot.dashboard.deploymentHealth >= 70 ? "Deployment health acceptable" : "Low deployment health",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks,
  };
}
