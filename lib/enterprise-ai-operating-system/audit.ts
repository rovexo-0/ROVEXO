import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";

export type AiOsAuditAction =
  | "scan"
  | "analysis"
  | "recommendation"
  | "repair"
  | "approval"
  | "rejection"
  | "prediction"
  | "automation"
  | "configuration";

export function canPerformAiOsAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    scan: "run-scan",
    analysis: "run-analysis",
    repair: "create-repair-plan",
    approval: "approve-repair",
    rejection: "cancel-repair",
    publish: "publish-config",
    rollback: "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForAiOs(action: AiOsAuditAction): boolean {
  return ["repair", "approval", "configuration"].includes(action);
}

export function createAiOsAuditEntry(action: AiOsAuditAction, actor: string, target: string) {
  return { id: `aios-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
