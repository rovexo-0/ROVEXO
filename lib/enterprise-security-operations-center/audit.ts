import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";

export type SocAuditAction =
  | "scan"
  | "block"
  | "unblock"
  | "quarantine"
  | "isolate"
  | "rotate"
  | "revoke"
  | "lockdown"
  | "export"
  | "import"
  | "configuration";

export function canPerformSocAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    scan: "scan",
    block: "block",
    unblock: "unblock",
    quarantine: "quarantine",
    isolate: "isolate",
    rotate: "rotate",
    revoke: "revoke",
    export: "export",
    import: "import",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
    "toggle-lockdown": "block",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_SOC_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForSoc(action: SocAuditAction): boolean {
  return ["block", "unblock", "quarantine", "isolate", "rotate", "revoke", "lockdown", "export", "import", "configuration"].includes(action);
}

export function createSocAuditEntry(action: SocAuditAction, actor: string, target: string) {
  return { id: `soc-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
