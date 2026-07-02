import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";

export type DevelopmentAuditAction = "validate" | "export" | "deploy" | "configuration";

export function canPerformDevelopmentAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    export: "export",
    deploy: "deploy",
    build: "build",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForDevelopment(action: DevelopmentAuditAction): boolean {
  return ["deploy", "configuration"].includes(action);
}

export function createDevelopmentAuditEntry(action: DevelopmentAuditAction, actor: string, target: string) {
  return { id: `dev-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
