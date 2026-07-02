import type { MobileCcSnapshot } from "@/lib/enterprise-mobile-control-center/types";

export function computeMobileCcHealth(snapshot: Pick<MobileCcSnapshot, "health" | "featureFlags" | "dashboard">) {
  if (snapshot.featureFlags.mobile_cc_enabled === false) {
    return { status: "failed" as const, score: 0, checks: ["Mobile CC disabled"] };
  }
  const checks = [
    snapshot.dashboard.pushStatus !== "offline" ? "Push healthy" : "Push offline",
    snapshot.dashboard.releaseHealth >= 50 ? "Release health acceptable" : "Low release health",
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return {
    status: snapshot.health.status,
    score: snapshot.health.score,
    checks,
  };
}
