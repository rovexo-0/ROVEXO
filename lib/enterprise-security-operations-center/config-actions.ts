import { canPerformSocAction } from "@/lib/enterprise-security-operations-center/audit";
import { socConfigLifecycle, type SocConfigDocument } from "@/lib/enterprise-security-operations-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isSocConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeSocConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: SocConfigDocument; historyId?: string },
): Promise<SocConfigDocument | { exported: SocConfigDocument } | void> {
  const permission = canPerformSocAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return socConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return socConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return socConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return socConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await socConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
