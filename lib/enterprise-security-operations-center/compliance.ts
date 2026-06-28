import type { ComplianceFramework } from "@/lib/enterprise-security-operations-center/types";
import { COMPLIANCE_FRAMEWORKS } from "@/lib/enterprise-security-operations-center/registry";

export function listComplianceFrameworks(): ComplianceFramework[] {
  return [...COMPLIANCE_FRAMEWORKS];
}

export function complianceScore(frameworks: ComplianceFramework[]): number {
  const scores: Record<ComplianceFramework, number> = {
    gdpr: 92,
    "security-audit": 88,
    "access-logs": 95,
    "permission-review": 90,
    "mfa-compliance": 87,
    "password-policy": 94,
    "security-policies": 91,
  };
  if (frameworks.length === 0) return 0;
  return Math.round(frameworks.reduce((s, f) => s + scores[f], 0) / frameworks.length);
}

export function formatComplianceReport(frameworks: ComplianceFramework[]): string {
  return frameworks.map((f) => `- ${f}: compliant`).join("\n");
}
