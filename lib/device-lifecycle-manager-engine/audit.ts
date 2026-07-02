import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditDeviceLifecycleManagerAction(input: {
  actorId: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "device_lifecycle_manager.change",
    resourceType: "device_lifecycle_manager",
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

export function canPerformDeviceRemoteAction(
  action: string,
  settings: { requireMfa: boolean },
  device: { locked: boolean; trustStatus: string },
): { allowed: boolean; reason?: string } {
  if (!settings.requireMfa) return { allowed: false, reason: "MFA required for remote actions" };
  if (device.locked && !["remove", "revoke", "generate-report"].includes(action)) {
    return { allowed: false, reason: "Device locked — only revoke, remove, or report allowed" };
  }
  return { allowed: true };
}
