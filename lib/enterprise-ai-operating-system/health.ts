import type { AiOsSnapshot } from "@/lib/enterprise-ai-operating-system/types";

export function computeAiOsHealth(snapshot: Pick<AiOsSnapshot, "health" | "featureFlags" | "dashboard">) {
  if (snapshot.featureFlags.ai_os_enabled === false) {
    return { status: "failed" as const, score: 0, checks: ["AI OS disabled"] };
  }
  const checks = [
    snapshot.dashboard.aiStatus !== "critical" ? "AI status acceptable" : "Critical AI status",
    snapshot.dashboard.sentinelAlerts < 5 ? "Sentinel alerts manageable" : "High alert volume",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks,
  };
}
