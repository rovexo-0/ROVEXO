import { COMPLIANCE_FRAMEWORKS } from "@/lib/enterprise-business-intelligence/registry";

export function listComplianceFrameworks() {
  return [...COMPLIANCE_FRAMEWORKS];
}

export function complianceScore(frameworks: readonly string[]): number {
  const scores: Record<string, number> = {
    gdpr: 92,
    "security-audit": 88,
    "access-logs": 95,
    "permission-review": 90,
    "mfa-compliance": 87,
    "password-policy": 94,
    "security-policies": 91,
  };
  if (frameworks.length === 0) return 0;
  return Math.round(frameworks.reduce((s, f) => s + (scores[f] ?? 80), 0) / frameworks.length);
}
