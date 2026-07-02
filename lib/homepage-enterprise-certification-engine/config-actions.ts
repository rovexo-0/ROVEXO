import { canPerformHomepageCertificationAction } from "@/lib/homepage-enterprise-certification-engine/audit";
import { homepageCertificationConfigLifecycle, type HomepageCertificationConfigDocument } from "@/lib/homepage-enterprise-certification-engine/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isHomepageCertificationConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeHomepageCertificationConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: HomepageCertificationConfigDocument; historyId?: string },
): Promise<HomepageCertificationConfigDocument | { exported: HomepageCertificationConfigDocument } | void> {
  const permission = canPerformHomepageCertificationAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return homepageCertificationConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return homepageCertificationConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return homepageCertificationConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return homepageCertificationConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await homepageCertificationConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
