import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";

export type QaAuditAction = "validate" | "scan" | "fix" | "certify" | "priority" | "export";

export function canPerformQaAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    scan: "scan",
    fix: "fix",
    certify: "certify",
    priority: "priority",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: OMEGA_QA_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForQa(action: QaAuditAction): boolean {
  return action === "certify";
}

export function createQaAuditEntry(action: QaAuditAction, actor: string, target: string) {
  return { id: `qa-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
