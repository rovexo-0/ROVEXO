import type { MarketplaceCompletionSnapshot } from "@/lib/enterprise-marketplace-completion-engine/types";

export function computeMarketplaceCompletionHealth(
  snapshot: Pick<MarketplaceCompletionSnapshot, "health" | "featureFlagsConfig" | "dashboard" | "settings" | "blockers" | "completionScan">,
) {
  if (snapshot.featureFlagsConfig.enterprise_marketplace_completion_engine_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["Marketplace Completion Engine disabled"] };
  }
  const activeBlockers = snapshot.blockers.filter((b) => b.active).length;
  const checks = [
    snapshot.dashboard.overallPassPercent >= 100 ? `Overall PASS ${snapshot.dashboard.overallPassPercent}%` : "Overall PASS below 100%",
    snapshot.settings.validationOnlyMode ? "Validation-only mode active" : "WARNING: Validation-only mode disabled",
    snapshot.dashboard.marketplaceReady ? "Marketplace Ready" : "Marketplace completion pending",
    snapshot.dashboard.modulesComplete === snapshot.dashboard.modulesTotal ? "All modules complete" : `${snapshot.dashboard.modulesComplete}/${snapshot.dashboard.modulesTotal} modules complete`,
    activeBlockers === 0 ? "No active release blockers" : `${activeBlockers} active blocker(s)`,
    snapshot.completionScan.launchReadinessPass ? "Launch Readiness PASS" : "Launch Readiness pending",
    snapshot.health.score >= 95 ? "Marketplace completion engine healthy" : "Marketplace completion degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
