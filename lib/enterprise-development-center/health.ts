import type { DevelopmentSnapshot } from "@/lib/enterprise-development-center/types";

export function computeDevelopmentHealth(snapshot: Pick<DevelopmentSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.enterprise_development_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Development Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.enterpriseScore >= 95 ? `Enterprise score ${snapshot.dashboard.enterpriseScore}%` : "Score below target",
    snapshot.dashboard.certificationReadiness >= 90 ? "Certification ready" : "Certification pending",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
