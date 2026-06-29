import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { RegistryHistoryEntry } from "@/lib/enterprise-module-registry-v2/types";

export function createRegistryAuditEntry(input: {
  action: string;
  actorId: string;
  moduleId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): RegistryHistoryEntry {
  return {
    id: `emr-${Date.now().toString(36)}`,
    action: input.action,
    moduleId: input.moduleId,
    actorId: input.actorId,
    timestamp: new Date().toISOString(),
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable,
  };
}

export async function auditRegistryAction(input: {
  actorId: string;
  action: string;
  moduleId?: string;
  previousValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "enterprise_module_registry_v2.change",
    resourceType: "enterprise_module_registry_v2",
    resourceId: input.moduleId ?? "module-registry-v2",
    metadata: toAuditLogMetadata({
      action: input.action,
      moduleId: input.moduleId,
      previousValue: input.previousValue,
      newValue: input.newValue,
      time: new Date().toISOString(),
    }),
  });
}
