import type { GlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/types";

export function computeGlobalUiIntegrityHealth(
  snapshot: Pick<GlobalUiIntegritySnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings" | "globalScan" | "productionRequirements">,
) {
  if (snapshot.featureFlagsConfig.omega_global_ui_integrity_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Global UI Integrity Engine disabled"] };
  }
  const checks = [
    snapshot.dashboard.overallPassPercent >= 100 ? `Overall PASS ${snapshot.dashboard.overallPassPercent}%` : "Overall PASS below 100%",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Validation-only mode disabled",
    snapshot.globalScan.certificationEligible ? "Global integrity certification eligible" : "Global integrity violations detected",
    snapshot.dashboard.productionReady ? "Production ready" : "Production pending",
    snapshot.productionRequirements.every((r) => r.status === "pass") ? "All production requirements PASS" : "Production requirements incomplete",
    snapshot.health.score >= 95 ? "Global UI integrity engine healthy" : "Global UI integrity degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
