import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditAuditComplianceEngineAction(input: {
  actorId: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "audit_compliance_engine.change",
    resourceType: "audit_compliance_engine",
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

export function createAuditComplianceEngineAuditEntry(input: {
  administrator: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}) {
  return {
    id: `ac-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  };
}
