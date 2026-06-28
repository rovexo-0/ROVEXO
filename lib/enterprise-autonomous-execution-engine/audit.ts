import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";

export type ExecutionEngineAuditAction = "orchestrate" | "execute" | "prioritize" | "approve" | "recover" | "export";

export function canPerformExecutionEngineAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    orchestrate: "orchestrate",
    execute: "execute",
    prioritize: "prioritize",
    approve: "approve",
    recover: "recover",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: EXECUTION_ENGINE_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForExecutionEngine(action: string): boolean {
  return ["approve", "publish-config", "rollback-config", "import-config"].includes(action);
}

export function createExecutionEngineAuditEntry(action: ExecutionEngineAuditAction, actor: string, target: string) {
  return { id: `exe-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
