import type { SocSnapshot } from "@/lib/enterprise-security-operations-center/types";

export function computeSocHealth(snapshot: Pick<SocSnapshot, "health" | "featureFlagsConfig" | "dashboard">) {
  if (snapshot.featureFlagsConfig.enterprise_soc_v1 === false) {
    return { status: "failed" as const, score: 0, checks: ["SOC disabled"] };
  }
  const checks = [
    snapshot.dashboard.firewallStatus === "lockdown" ? "Emergency lockdown active" : `Firewall ${snapshot.dashboard.firewallStatus}`,
    snapshot.dashboard.openVulnerabilities === 0 ? "No open vulnerabilities" : `${snapshot.dashboard.openVulnerabilities} open vulnerability(ies)`,
    snapshot.health.score >= 50 ? "Engine responsive" : "Engine degraded",
  ];
  return { status: snapshot.health.status, score: snapshot.health.score, checks };
}
