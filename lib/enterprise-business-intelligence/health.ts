import type { BiSnapshot } from "@/lib/enterprise-business-intelligence/types";

export function computeBiHealth(snapshot: Pick<BiSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.enterprise_business_intelligence_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["BI Center disabled"] };
  }
  const checks = [
    snapshot.dashboard.platformHealth >= 80 ? "Platform health strong" : "Platform health needs attention",
    snapshot.dashboard.marketplaceGrowth >= 0 ? `Growth +${snapshot.dashboard.marketplaceGrowth}%` : "Negative growth trend",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
