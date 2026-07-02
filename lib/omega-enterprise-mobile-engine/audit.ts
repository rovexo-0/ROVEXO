import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { OmegaActionId, OmegaEnterpriseSettings } from "@/lib/omega-enterprise-mobile-engine/types";

export async function auditOmegaEnterpriseMobileAction(input: {
  actorId: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "omega_enterprise_mobile.change",
    resourceType: "omega_enterprise_mobile",
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

export function canPerformOmegaAction(
  action: OmegaActionId,
  settings: OmegaEnterpriseSettings,
): { allowed: boolean; reason?: string } {
  if (action === "emergency-mode" && settings.maintenanceMode) {
    return { allowed: false, reason: "Disable maintenance mode before emergency mode" };
  }
  if (action === "maintenance-mode" && settings.emergencyMode) {
    return { allowed: false, reason: "Disable emergency mode before maintenance mode" };
  }
  return { allowed: true };
}
