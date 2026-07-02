import { canPerformObservabilityAction } from "@/lib/enterprise-observability-center/audit";
import { observabilityConfigLifecycle, type ObservabilityConfigDocument } from "@/lib/enterprise-observability-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isObservabilityConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeObservabilityConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: ObservabilityConfigDocument; historyId?: string },
): Promise<ObservabilityConfigDocument | { exported: ObservabilityConfigDocument } | void> {
  const permission = canPerformObservabilityAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return observabilityConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return observabilityConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return observabilityConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return observabilityConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await observabilityConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
