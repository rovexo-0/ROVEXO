import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { EnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture/types";

export function createEnterpriseConfigAuditEntry(input: {
  administrator: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): EnterpriseConfigAuditEntry {
  return {
    id: `ea-${Date.now().toString(36)}`,
    administrator: input.administrator,
    module: input.module,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable,
    timestamp: new Date().toISOString(),
  };
}

export async function traceEnterpriseModuleAction(input: {
  actorId: string;
  moduleId: string;
  action: string;
  resourceId?: string;
  previousValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: `${input.moduleId}.change`,
    resourceType: input.moduleId,
    resourceId: input.resourceId ?? input.moduleId,
    metadata: toAuditLogMetadata({
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      time: new Date().toISOString(),
    }),
  });
}
