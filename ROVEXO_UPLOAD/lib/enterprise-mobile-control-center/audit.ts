import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";

export type MobileCcAuditAction =
  | "build"
  | "publish"
  | "download"
  | "push"
  | "ota"
  | "rollback"
  | "device-action"
  | "login"
  | "logout"
  | "certificate-update"
  | "configuration";

export function canPerformMobileCcAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    build: "build",
    "send-push": "send-push",
    "create-ota": "create-ota",
    "remote-logout": "remote-logout",
    "disable-device": "disable-device",
    publish: "publish",
    rollback: "rollback",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForMobileCc(action: MobileCcAuditAction): boolean {
  return ["publish", "rollback", "ota", "device-action", "configuration"].includes(action);
}

export function createMobileCcAuditEntry(action: MobileCcAuditAction, actor: string, target: string) {
  return { id: `mcc-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}
