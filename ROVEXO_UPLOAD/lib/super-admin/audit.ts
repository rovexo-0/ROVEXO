import { writeAuditLog } from "@/lib/platform-analytics/events";
import { toAuditLogMetadata, type AuditLogMetadata } from "@/lib/audit/metadata";

export async function auditSuperAdminAction(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: AuditLogMetadata | Record<string, unknown>;
}): Promise<void> {
  await writeAuditLog({
    actorId: input.actorId,
    action: `super_admin.${input.action}`,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    metadata: toAuditLogMetadata(input.metadata),
  });
}
