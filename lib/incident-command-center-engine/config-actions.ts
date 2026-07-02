import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import {
  incidentCommandConfigLifecycle,
  syncIncidentCommandSettingsFromLive,
  type IncidentCommandConfigDocument,
} from "@/lib/incident-command-center-engine/config";
import { INCIDENT_COMMAND_MODULE_DESCRIPTOR } from "@/lib/incident-command-center-engine/descriptor";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isIncidentCommandConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeIncidentCommandConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: IncidentCommandConfigDocument; historyId?: string },
): Promise<IncidentCommandConfigDocument | { exported: IncidentCommandConfigDocument } | void> {
  const permission = canPerformModuleAction({
    moduleId: INCIDENT_COMMAND_MODULE_DESCRIPTOR.id,
    action: action === "publish" ? "publish-config" : action === "rollback" ? "rollback-config" : `${action}`,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return incidentCommandConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish": {
      const published = await incidentCommandConfigLifecycle.publish(actorId);
      await syncIncidentCommandSettingsFromLive(actorId);
      return published;
    }
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      const restored = await incidentCommandConfigLifecycle.rollback(payload.historyId, actorId);
      await syncIncidentCommandSettingsFromLive(actorId);
      return restored;
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return incidentCommandConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await incidentCommandConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
