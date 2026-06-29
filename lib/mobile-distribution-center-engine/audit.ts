import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditMobileDistributionCenterEngineAction(input: {
  actorId: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "mobile_distribution_center_engine.change",
    resourceType: "mobile_distribution_center_engine",
    resourceId: input.module,
    metadata: toAuditLogMetadata({
      module: input.module,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      rollbackAvailable: input.rollbackAvailable ?? true,
      time: new Date().toISOString(),
    }),
  });
}

export function createMobileDistributionCenterEngineAuditEntry(input: {
  administrator: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}) {
  return {
    id: `mdc-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  };
}

export function canPerformMobileDistributionAction(
  action: "remove-device" | "rename-device" | "remote-logout" | "block-device" | "trust-device" | "switch-language" | "refresh-qr" | "export",
  security: { mfaEnabled: boolean; deviceVerification: boolean },
): boolean {
  if (!security.mfaEnabled || !security.deviceVerification) return false;
  return ["remove-device", "rename-device", "remote-logout", "block-device", "trust-device", "switch-language", "refresh-qr", "export"].includes(action);
}
