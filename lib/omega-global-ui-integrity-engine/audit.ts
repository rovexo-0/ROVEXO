import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";

export function canPerformGlobalUiIntegrityAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    repair: "repair",
    certify: "certify",
    export: "export",
    analyze: "analyze",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForGlobalUiIntegrity(action: string): boolean {
  return ["certify", "repair", "publish-config", "rollback-config", "import-config"].includes(action);
}
