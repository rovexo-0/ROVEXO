import { canPerformCategoryManagementAction } from "@/lib/enterprise-category-management-center/audit";
import { categoryManagementConfigLifecycle, type CategoryManagementConfigDocument } from "@/lib/enterprise-category-management-center/config";

const CONFIG_ACTIONS = new Set(["save-draft", "publish-config", "rollback-config", "import-config", "export-config"]);

export function isCategoryManagementConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeCategoryManagementConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: CategoryManagementConfigDocument; historyId?: string },
): Promise<CategoryManagementConfigDocument | { exported: CategoryManagementConfigDocument } | void> {
  const permission = canPerformCategoryManagementAction({ action, mfaVerified: true });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return categoryManagementConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish-config":
      return categoryManagementConfigLifecycle.publish(actorId);
    case "rollback-config":
      if (!payload?.historyId) throw new Error("historyId required");
      return categoryManagementConfigLifecycle.rollback(payload.historyId, actorId);
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return categoryManagementConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await categoryManagementConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
