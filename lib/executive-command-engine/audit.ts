import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditExecutiveCommandAction(input: {
  actorId: string;
  action: string;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "executive_command.change",
    resourceType: "executive_command",
    resourceId: "executive-command",
    metadata: toAuditLogMetadata({
      action: input.action,
      newValue: input.newValue,
      time: new Date().toISOString(),
    }),
  });
}
