import { canPerformGovernanceAction } from "@/lib/enterprise-governance-center/audit";
import { governanceConfigLifecycle, type GovernanceConfigDocument } from "@/lib/enterprise-governance-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isGovernanceConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeGovernanceConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: GovernanceConfigDocument; historyId?: string },
): Promise<GovernanceConfigDocument | { exported: GovernanceConfigDocument } | void> {
  const permission = canPerformGovernanceAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return governanceConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return governanceConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return governanceConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return governanceConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await governanceConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
