import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";

export type E2eValidationAuditAction = "validate" | "regression" | "analyze" | "export";

export function canPerformE2eValidationAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    regression: "regression",
    analyze: "analyze",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: E2E_VALIDATION_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForE2eValidation(action: string): boolean {
  return ["publish-config", "rollback-config", "import-config"].includes(action);
}

export function createE2eValidationAuditEntry(action: E2eValidationAuditAction, actor: string, target: string) {
  return { id: `e2e-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
