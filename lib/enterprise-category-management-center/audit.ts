import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-category-management-center/descriptor";

export function canPerformCategoryManagementAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    sync: "sync",
    import: "import",
    export: "export",
    analyze: "analyze",
    certify: "certify",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForCategoryManagement(action: string): boolean {
  return ["certify", "sync", "import", "publish-config", "rollback-config", "import-config"].includes(action);
}
