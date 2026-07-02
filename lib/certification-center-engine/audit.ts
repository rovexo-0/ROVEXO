import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditCertificationCenterEngineAction(input: {
  actorId: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "certification_center_engine.change",
    resourceType: "certification_center_engine",
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

export function createCertificationCenterEngineAuditEntry(input: {
  administrator: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}) {
  return {
    id: `cc-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  };
}
