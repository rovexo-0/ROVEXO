import { canPerformExecutionEngineAction } from "@/lib/enterprise-autonomous-execution-engine/audit";
import { executionEngineConfigLifecycle, type ExecutionEngineConfigDocument } from "@/lib/enterprise-autonomous-execution-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isExecutionEngineConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeExecutionEngineConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: ExecutionEngineConfigDocument; historyId?: string },
): Promise<ExecutionEngineConfigDocument | { exported: ExecutionEngineConfigDocument } | void> {
  const permission = canPerformExecutionEngineAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return executionEngineConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return executionEngineConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return executionEngineConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return executionEngineConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await executionEngineConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
