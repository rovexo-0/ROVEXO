import { canPerformMobileCcAction } from "@/lib/enterprise-mobile-control-center/audit";
import { mobileCcConfigLifecycle, type MobileCcConfigDocument } from "@/lib/enterprise-mobile-control-center/config";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish-config",
  "rollback-config",
  "import-config",
  "export-config",
]);

export function isMobileCcConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeMobileCcConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: MobileCcConfigDocument; historyId?: string },
): Promise<MobileCcConfigDocument | { exported: MobileCcConfigDocument } | void> {
  const permission = canPerformMobileCcAction({
    action,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return mobileCcConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return mobileCcConfigLifecycle.publish(actorId);
    case "rollback-config": {
      if (!payload?.historyId) throw new Error("historyId required");
      return mobileCcConfigLifecycle.rollback(payload.historyId, actorId);
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return mobileCcConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await mobileCcConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
