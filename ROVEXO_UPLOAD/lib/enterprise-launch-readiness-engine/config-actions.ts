import { canPerformLaunchReadinessAction } from "@/lib/enterprise-launch-readiness-engine/audit";
import { launchReadinessConfigLifecycle, type LaunchReadinessConfigDocument } from "@/lib/enterprise-launch-readiness-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isLaunchReadinessConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeLaunchReadinessConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: LaunchReadinessConfigDocument; historyId?: string },
): Promise<LaunchReadinessConfigDocument | { exported: LaunchReadinessConfigDocument } | void> {
  const permission = canPerformLaunchReadinessAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return launchReadinessConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return launchReadinessConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return launchReadinessConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return launchReadinessConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await launchReadinessConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
