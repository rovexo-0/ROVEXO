import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import {
  enterpriseComplianceConfigLifecycle,
  syncEnterpriseComplianceSettingsFromLive,
  type EnterpriseComplianceConfigDocument,
} from "@/lib/enterprise-compliance-center-engine/config";
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";

const CONFIG_ACTIONS = new Set([
  "save-draft",
  "publish",
  "rollback",
  "import-config",
  "export-config",
]);

export function isEnterpriseComplianceConfigAction(action: string): boolean {
  return CONFIG_ACTIONS.has(action);
}

export async function executeEnterpriseComplianceConfigAction(
  action: string,
  actorId: string,
  payload?: { document?: EnterpriseComplianceConfigDocument; historyId?: string },
): Promise<EnterpriseComplianceConfigDocument | { exported: EnterpriseComplianceConfigDocument } | void> {
  const permission = canPerformModuleAction({
    moduleId: ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.id,
    action: action === "publish" ? "publish-config" : action === "rollback" ? "rollback-config" : `${action}`,
    mfaVerified: true,
  });
  if (!permission.allowed) throw new Error(permission.reason ?? "Config action not allowed");

  switch (action) {
    case "save-draft":
      if (!payload?.document) throw new Error("document required");
      return enterpriseComplianceConfigLifecycle.saveDraft(payload.document, actorId);
    case "publish": {
      const published = await enterpriseComplianceConfigLifecycle.publish(actorId);
      await syncEnterpriseComplianceSettingsFromLive(actorId);
      return published;
    }
    case "rollback": {
      if (!payload?.historyId) throw new Error("historyId required");
      const restored = await enterpriseComplianceConfigLifecycle.rollback(payload.historyId, actorId);
      await syncEnterpriseComplianceSettingsFromLive(actorId);
      return restored;
    }
    case "import-config":
      if (!payload?.document) throw new Error("document required");
      return enterpriseComplianceConfigLifecycle.importDocument(payload.document, actorId);
    case "export-config":
      return { exported: await enterpriseComplianceConfigLifecycle.exportDocument() };
    default:
      throw new Error("Unknown config action");
  }
}
