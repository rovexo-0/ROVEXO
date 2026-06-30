import { canPerformDeploymentAction } from "@/lib/enterprise-deployment-center/audit";
import { deploymentConfigLifecycle, type DeploymentConfigDocument } from "@/lib/enterprise-deployment-center/config";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish-config",
  "rollback-config",
  "import-config",
  "export-config",
]);

export function isDeploymentConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeDeploymentConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: DeploymentConfigDocument; historyId?: string },
): Promise<DeploymentConfigDocument | { exported: DeploymentConfigDocument } | void> {
  const permission = canPerformDeploymentAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return deploymentConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return deploymentConfigLifecycle.publish(actorId);
    case "rollback-config": {
      if (!payload?.historyId) throw new Error("historyId required");
      return deploymentConfigLifecycle.rollback(payload.historyId, actorId);
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return deploymentConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await deploymentConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
