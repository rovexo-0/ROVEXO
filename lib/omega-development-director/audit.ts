import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";

export type DevDirectorAuditAction = "analyze" | "discover" | "prioritize" | "repair" | "export";

export function canPerformDevDirectorAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    analyze: "analyze",
    discover: "discover",
    prioritize: "prioritize",
    repair: "repair",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForDevDirector(action: string): boolean {
  return ["publish-config", "rollback-config", "import-config"].includes(action);
}

export function createDevDirectorAuditEntry(action: DevDirectorAuditAction, actor: string, target: string) {
  return { id: `odd-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
