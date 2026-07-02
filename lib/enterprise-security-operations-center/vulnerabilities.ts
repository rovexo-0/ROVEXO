import type { ThreatLevel, VulnerabilityRecord } from "@/lib/enterprise-security-operations-center/types";

export function createDefaultVulnerabilities(): VulnerabilityRecord[] {
  return [
    { id: "vuln-1", severity: "medium", component: "next.config headers", description: "Content-Security-Policy enforced via lib/ops/security-headers.ts", status: "mitigated" },
    { id: "vuln-2", severity: "low", component: "dependency: lodash", description: "Minor version behind latest patch", status: "accepted" },
    { id: "vuln-3", severity: "high", component: "api/rate-limiter", description: "Rate limit bypass on bulk export endpoint", status: "mitigated", cve: "ROV-2026-001" },
  ];
}

export function openVulnerabilities(vulns: VulnerabilityRecord[]): VulnerabilityRecord[] {
  return vulns.filter((v) => v.status === "open");
}

export function vulnerabilityRiskScore(vulns: VulnerabilityRecord[]): number {
  const weights: Record<ThreatLevel, number> = { critical: 30, high: 20, medium: 10, low: 5, info: 1 };
  return Math.min(100, openVulnerabilities(vulns).reduce((s, v) => s + weights[v.severity], 0));
}
