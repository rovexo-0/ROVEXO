import { canPerformAiOsAction } from "@/lib/enterprise-ai-operating-system/audit";
import { aiOsConfigLifecycle, type AiOsConfigDocument } from "@/lib/enterprise-ai-operating-system/config";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isAiOsConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeAiOsConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: AiOsConfigDocument; historyId?: string },
): Promise<AiOsConfigDocument | { exported: AiOsConfigDocument } | void> {
  const permission = canPerformAiOsAction({
    action: action === "publish" ? "publish" : action === "rollback" ? "rollback" : action,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return aiOsConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish":
      return aiOsConfigLifecycle.publish(actorId);
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      return aiOsConfigLifecycle.rollback(payload.historyId, actorId);
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return aiOsConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await aiOsConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
