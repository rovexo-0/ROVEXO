import { canPerformMarketplaceCompletionAction } from "@/lib/enterprise-marketplace-completion-engine/audit";
import { marketplaceCompletionConfigLifecycle, type MarketplaceCompletionConfigDocument } from "@/lib/enterprise-marketplace-completion-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isMarketplaceCompletionConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeMarketplaceCompletionConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: MarketplaceCompletionConfigDocument; historyId?: string },
) {
  const permission = canPerformMarketplaceCompletionAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return marketplaceCompletionConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return marketplaceCompletionConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return marketplaceCompletionConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return marketplaceCompletionConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await marketplaceCompletionConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
