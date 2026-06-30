import type { OmegaSnapshot } from "@/lib/omega-command-center/types";

export function computeOmegaHealth(snapshot: Pick<OmegaSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.omega_command_center_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["OMEGA Command Center disabled"] };
  }
  const score = snapshot.dashboard.enterpriseScore;
  const checks = [
    score >= 80 ? `Enterprise score ${score}/100` : "Enterprise score needs attention",
    snapshot.dashboard.engineStates.every((e) => e.health !== "critical") ? "All AI engines healthy" : "Engine degradation detected",
    snapshot.health.score >= 50 ? "Orchestrator responsive" : "Orchestrator degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
