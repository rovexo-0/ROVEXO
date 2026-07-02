import { canPerformAutomationAction } from "@/lib/enterprise-automation-hub/audit";
import { automationConfigLifecycle, type AutomationConfigDocument } from "@/lib/enterprise-automation-hub/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isAutomationConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeAutomationConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: AutomationConfigDocument; historyId?: string },
): Promise<AutomationConfigDocument | { exported: AutomationConfigDocument } | void> {
  const permission = canPerformAutomationAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return automationConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return automationConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return automationConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return automationConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await automationConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
