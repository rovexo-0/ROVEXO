import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import {
  incidentTimelineConfigLifecycle,
  syncIncidentTimelineSettingsFromLive,
  type IncidentTimelineConfigDocument,
} from "@/lib/incident-timeline-engine/config";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isIncidentTimelineConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeIncidentTimelineConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: IncidentTimelineConfigDocument; historyId?: string },
): Promise<IncidentTimelineConfigDocument | { exported: IncidentTimelineConfigDocument } | void> {
  const permission = canPerformModuleAction({
    moduleId: INCIDENT_TIMELINE_MODULE_DESCRIPTOR.id,
    action: action === "publish" ? "publish-config" : action === "rollback" ? "rollback-config" : `${action}`,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return incidentTimelineConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish": {
      const published = await incidentTimelineConfigLifecycle.publish(actorId);
      await syncIncidentTimelineSettingsFromLive(actorId);
      return published;
    }
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      const restored = await incidentTimelineConfigLifecycle.rollback(payload.historyId, actorId);
      await syncIncidentTimelineSettingsFromLive(actorId);
      return restored;
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return incidentTimelineConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await incidentTimelineConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
