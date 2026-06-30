import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";

export type GovernanceAuditAction = "scan" | "validate" | "certify" | "export" | "report" | "configuration";

export function canPerformGovernanceAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    scan: "scan",
    validate: "validate",
    certify: "certify",
    export: "export",
    report: "report",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForGovernance(action: GovernanceAuditAction): boolean {
  return ["certify", "configuration"].includes(action);
}

export function createGovernanceAuditEntry(action: GovernanceAuditAction, actor: string, target: string) {
  return { id: `gov-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
