import { canPerformE2eValidationAction } from "@/lib/enterprise-e2e-validation-engine/audit";
import { e2eValidationConfigLifecycle, type E2eValidationConfigDocument } from "@/lib/enterprise-e2e-validation-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isE2eValidationConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeE2eValidationConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: E2eValidationConfigDocument; historyId?: string },
): Promise<E2eValidationConfigDocument | { exported: E2eValidationConfigDocument } | void> {
  const permission = canPerformE2eValidationAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return e2eValidationConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return e2eValidationConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return e2eValidationConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return e2eValidationConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await e2eValidationConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
