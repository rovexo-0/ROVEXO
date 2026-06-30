import type { HomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/types";

export function computeHomepageCertificationHealth(
  snapshot: Pick<
    HomepageCertificationSnapshot,
    "health" | "featureFlagsConfig" | "dashboard" | "settings" | "integrity" | "integrityScan" | "engineeringScan"
  >,
) {
  if (snapshot.featureFlagsConfig.homepage_enterprise_certification_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Homepage Certification Engine disabled"] };
  }
  const checks = [
    snapshot.dashboard.overallPassPercent >= 100 ? `Overall PASS ${snapshot.dashboard.overallPassPercent}%` : "Overall PASS below 100%",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Validation-only mode disabled",
    snapshot.dashboard.certificationGranted ? "Production certification granted" : "Certification pending",
    snapshot.dashboard.productionReady ? "Homepage production ready" : "Production readiness pending",
    snapshot.integrityScan?.searchBarTopGapPass !== false ? "Search bar top gap PASS" : "FAIL: Empty space above search bar",
    snapshot.integrity.every((item) => item.status === "pass") ? "Homepage integrity PASS" : "Homepage integrity violations detected",
    snapshot.engineeringScan?.healthScore >= 100
      ? `Homepage Engineering Director health ${snapshot.engineeringScan.healthScore}%`
      : "Homepage Engineering Director health below 100%",
    snapshot.engineeringScan?.completionPercent >= 100
      ? "Homepage completion PASS"
      : `Homepage completion ${snapshot.engineeringScan?.completionPercent ?? 0}%`,
    snapshot.health.score >= 95 ? "Homepage certification engine healthy" : "Homepage certification degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
