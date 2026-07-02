import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";

export type AutomationAuditAction =
  | "run"
  | "pause"
  | "stop"
  | "enable"
  | "disable"
  | "publish"
  | "rollback"
  | "export"
  | "import"
  | "configuration";

export function canPerformAutomationAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    run: "run",
    pause: "pause",
    stop: "stop",
    enable: "enable",
    disable: "disable",
    publish: "publish",
    rollback: "rollback",
    export: "export",
    import: "import",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    refresh: "view",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForAutomation(action: AutomationAuditAction): boolean {
  return ["publish", "rollback", "import", "configuration"].includes(action);
}

export function createAutomationAuditEntry(action: AutomationAuditAction, actor: string, target: string) {
  return { id: `automation-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
