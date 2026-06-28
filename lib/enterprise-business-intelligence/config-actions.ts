import { canPerformBiAction } from "@/lib/enterprise-business-intelligence/audit";
import { biConfigLifecycle, type BiConfigDocument } from "@/lib/enterprise-business-intelligence/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isBiConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeBiConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: BiConfigDocument; historyId?: string },
): Promise<BiConfigDocument | { exported: BiConfigDocument } | void> {
  const permission = canPerformBiAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return biConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return biConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return biConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return biConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await biConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
