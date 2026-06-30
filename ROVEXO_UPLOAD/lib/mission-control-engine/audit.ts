import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditMissionControlEngineAction(input: {
  actorId: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "mission_control_engine.change",
    resourceType: "mission_control_engine",
    resourceId: input.module,
    metadata: toAuditLogMetadata({
      module: input.module,
      component: input.component,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      rollbackAvailable: input.rollbackAvailable ?? true,
      time: new Date().toISOString(),
    }),
  });
}

export function createMissionControlEngineAuditEntry(input: {
  administrator: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}) {
  return {
    id: `mce-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    component: input.component,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  };
}
