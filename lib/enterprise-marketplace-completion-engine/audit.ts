import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR } from "@/lib/enterprise-marketplace-completion-engine/descriptor";

export function canPerformMarketplaceCompletionAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    repair: "repair",
    certify: "certify",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForMarketplaceCompletion(action: string): boolean {
  return ["certify", "repair", "publish-config", "rollback-config", "import-config"].includes(action);
}
