import { canPerformDevelopmentAction } from "@/lib/enterprise-development-center/audit";
import { developmentConfigLifecycle, type DevelopmentConfigDocument } from "@/lib/enterprise-development-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isDevelopmentConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeDevelopmentConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: DevelopmentConfigDocument; historyId?: string },
): Promise<DevelopmentConfigDocument | { exported: DevelopmentConfigDocument } | void> {
  const permission = canPerformDevelopmentAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return developmentConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return developmentConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return developmentConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return developmentConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await developmentConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
