import { canPerformWorkflowAction } from "@/lib/enterprise-workflow-engine/audit";
import {
  workflowEngineConfigLifecycle,
  type WorkflowEngineConfigDocument,
} from "@/lib/enterprise-workflow-engine/config";
import { publishWorkflowVersion } from "@/lib/enterprise-workflow-engine/versioning";
import { importWorkflowBundle } from "@/lib/enterprise-workflow-engine/versioning";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isWorkflowEngineConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeWorkflowEngineConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: WorkflowEngineConfigDocument; historyId?: string },
): Promise<WorkflowEngineConfigDocument | { exported: WorkflowEngineConfigDocument } | void> {
  const permission = canPerformWorkflowAction({
    action: action === "publish" ? "publish" : action === "rollback" ? "rollback" : action,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return workflowEngineConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish": {
      const draft = await workflowEngineConfigLifecycle.getDraft();
      const publishedWorkflows = draft.settings.workflows.map((w) => {
        if (w.status === "draft") return publishWorkflowVersion(w, actorId).workflow;
        return w;
      });
      const nextDraft = {
        ...draft,
        settings: { ...draft.settings, workflows: publishedWorkflows },
      };
      await workflowEngineConfigLifecycle.saveDraft(nextDraft, actorId);
      return workflowEngineConfigLifecycle.publish(actorId);
    }
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      return workflowEngineConfigLifecycle.rollback(payload.historyId, actorId);
    }
    case "import-config": {
      if (!payload?.document) throw new Error("document required");
      const live = await workflowEngineConfigLifecycle.readLive();
      const imported = importWorkflowBundle(
        { workflows: payload.document.settings.workflows },
        live.settings.workflows,
      );
      const next = {
        ...payload.document,
        settings: { ...payload.document.settings, workflows: imported },
      };
      return workflowEngineConfigLifecycle.importDocument(next, actorId);
    }
    case "export-config":
      return { exported: await workflowEngineConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
