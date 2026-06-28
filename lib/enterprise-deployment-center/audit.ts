import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";

export type DeploymentAuditAction =
  | "build"
  | "validation"
  | "approval"
  | "deployment"
  | "rollback"
  | "failure"
  | "hotfix"
  | "emergency-release"
  | "environment-change"
  | "feature-flag-change"
  | "configuration";

export function canPerformDeploymentAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    build: "build",
    validate: "validate",
    deploy: "deploy",
    approve: "approve",
    reject: "reject",
    rollback: "rollback",
    cancel: "cancel",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForDeployment(action: DeploymentAuditAction): boolean {
  return ["approval", "deployment", "rollback", "emergency-release", "configuration"].includes(action);
}

export function createDeploymentAuditEntry(action: DeploymentAuditAction, actor: string, target: string) {
  return { id: `dep-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
