import { canPerformOmegaAction } from "@/lib/omega-command-center/audit";
import { omegaConfigLifecycle, type OmegaConfigDocument } from "@/lib/omega-command-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isOmegaConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeOmegaConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: OmegaConfigDocument; historyId?: string },
): Promise<OmegaConfigDocument | { exported: OmegaConfigDocument } | void> {
  const permission = canPerformOmegaAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return omegaConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return omegaConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return omegaConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return omegaConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await omegaConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
