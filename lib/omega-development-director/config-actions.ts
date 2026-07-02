import { canPerformDevDirectorAction } from "@/lib/omega-development-director/audit";
import { devDirectorConfigLifecycle, type DevDirectorConfigDocument } from "@/lib/omega-development-director/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isDevDirectorConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeDevDirectorConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: DevDirectorConfigDocument; historyId?: string },
): Promise<DevDirectorConfigDocument | { exported: DevDirectorConfigDocument } | void> {
  const permission = canPerformDevDirectorAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return devDirectorConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return devDirectorConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return devDirectorConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return devDirectorConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await devDirectorConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
