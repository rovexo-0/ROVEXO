import type { QaSnapshot } from "@/lib/omega-quality-assurance-center/types";

export function computeQaHealth(snapshot: Pick<QaSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.omega_quality_assurance_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["OMEGA QA Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.platformHealth >= 95 ? `Platform health ${snapshot.dashboard.platformHealth}%` : "Platform health below target",
    snapshot.dashboard.buttonCoverage >= 90 ? `Button coverage ${snapshot.dashboard.buttonCoverage}%` : "Button coverage below target",
    snapshot.health.score >= 50 ? "QA engine responsive" : "QA engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
