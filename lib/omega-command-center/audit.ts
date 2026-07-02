import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";

export type OmegaAuditAction =
  | "run-scan"
  | "quick-scan"
  | "deep-scan"
  | "pause"
  | "resume"
  | "cancel"
  | "repair"
  | "deploy"
  | "rollback"
  | "report"
  | "export"
  | "configuration";

export function canPerformOmegaAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    "run-scan": "run-scan",
    "quick-scan": "quick-scan",
    "deep-scan": "deep-scan",
    pause: "pause",
    resume: "resume",
    cancel: "cancel",
    repair: "repair",
    deploy: "deploy",
    rollback: "rollback",
    report: "report",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForOmega(action: OmegaAuditAction): boolean {
  return ["repair", "deploy", "rollback", "configuration"].includes(action);
}

export function createOmegaAuditEntry(action: OmegaAuditAction, actor: string, target: string) {
  return { id: `omega-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
