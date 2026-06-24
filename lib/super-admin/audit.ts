import { writeAuditLog } from "@/lib/platform-analytics/events";

export async function auditSuperAdminAction(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeAuditLog({
    actorId: input.actorId,
    action: `super_admin.${input.action}`,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata,
  });
}
