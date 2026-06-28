import { canPerformIncidentAction } from "@/lib/incident-response-center/audit";
import { incidentConfigLifecycle, type IncidentConfigDocument } from "@/lib/incident-response-center/config";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish-config",
  "rollback-config",
  "import-config",
  "export-config",
]);

export function isIncidentConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeIncidentConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: IncidentConfigDocument; historyId?: string },
): Promise<IncidentConfigDocument | { exported: IncidentConfigDocument } | void> {
  const permission = canPerformIncidentAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return incidentConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return incidentConfigLifecycle.publish(actorId);
    case "rollback-config": {
      if (!payload?.historyId) throw new Error("historyId required");
      return incidentConfigLifecycle.rollback(payload.historyId, actorId);
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return incidentConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await incidentConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
