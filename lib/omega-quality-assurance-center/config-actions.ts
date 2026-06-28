import { canPerformQaAction } from "@/lib/omega-quality-assurance-center/audit";
import { qaConfigLifecycle, type QaConfigDocument } from "@/lib/omega-quality-assurance-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isQaConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeQaConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: QaConfigDocument; historyId?: string },
): Promise<QaConfigDocument | { exported: QaConfigDocument } | void> {
  const permission = canPerformQaAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return qaConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return qaConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return qaConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return qaConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await qaConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
