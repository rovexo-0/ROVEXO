import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditEnterpriseCoreAction(input: {
  actorId: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
  ipAddress?: string;
  device?: string;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "enterprise_core.change",
    resourceType: "enterprise_core",
    resourceId: input.module,
    metadata: toAuditLogMetadata({
      module: input.module,
      component: input.component,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      rollbackAvailable: input.rollbackAvailable ?? true,
      ipAddress: input.ipAddress,
      device: input.device,
      time: new Date().toISOString(),
    }),
  });
}

export function createEnterpriseCoreAuditEntry(input: {
  administrator: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
  ipAddress?: string;
  device?: string;
}) {
  return {
    id: `eca-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    component: input.component,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
    ipAddress: input.ipAddress,
    device: input.device,
  };
}
