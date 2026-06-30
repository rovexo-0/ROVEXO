import { canPerformGlobalUiIntegrityAction } from "@/lib/omega-global-ui-integrity-engine/audit";
import { globalUiIntegrityConfigLifecycle, type GlobalUiIntegrityConfigDocument } from "@/lib/omega-global-ui-integrity-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isGlobalUiIntegrityConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeGlobalUiIntegrityConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: GlobalUiIntegrityConfigDocument; historyId?: string },
): Promise<GlobalUiIntegrityConfigDocument | { exported: GlobalUiIntegrityConfigDocument } | void> {
  const permission = canPerformGlobalUiIntegrityAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return globalUiIntegrityConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return globalUiIntegrityConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return globalUiIntegrityConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return globalUiIntegrityConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await globalUiIntegrityConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
