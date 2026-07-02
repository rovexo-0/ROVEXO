import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";

export type WorkflowAuditAction =
  | "create"
  | "update"
  | "delete"
  | "run"
  | "publish"
  | "rollback"
  | "approval"
  | "export"
  | "import"
  | "scheduler"
  | "failure";

export function canPerformWorkflowAction(input: {
  action: string;
  mfaVerified?: boolean;
}): { allowed: boolean; reason?: string } {
  const permissionMap: Record<string, string> = {
    create: "create",
    update: "update",
    delete: "delete",
    run: "run",
    publish: "publish-config",
    rollback: "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    approve: "approve",
    schedule: "schedule",
  };

  const mapped = permissionMap[input.action] ?? input.action;
  return canPerformModuleAction({
    moduleId: WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id,
    action: mapped,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function createWorkflowAuditEntry(
  action: WorkflowAuditAction,
  actor: string,
  target: string,
): { id: string; action: string; actor: string; target: string; timestamp: string } {
  return {
    id: `wfe-audit-${Date.now()}`,
    action,
    actor,
    target,
    timestamp: new Date().toISOString(),
  };
}

export function requiresMfa(action: WorkflowAuditAction): boolean {
  return ["publish", "rollback", "delete", "import"].includes(action);
}

export function resolveWorkflowRole(action: string): string {
  if (["publish", "rollback", "delete", "import"].includes(action)) return "workflow-admin";
  if (["create", "update"].includes(action)) return "workflow-editor";
  if (["run", "approve", "schedule"].includes(action)) return "workflow-operator";
  return "workflow-viewer";
}
