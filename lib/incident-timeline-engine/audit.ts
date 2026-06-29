import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { IncidentTimelineSettings } from "@/lib/incident-timeline-engine/types";

export async function auditIncidentTimelineAction(input: {
  actorId: string;
  action: string;
  exportId?: string;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "incident_timeline.change",
    resourceType: "incident_timeline",
    resourceId: input.exportId ?? "incident-timeline",
    metadata: toAuditLogMetadata({
      action: input.action,
      exportId: input.exportId,
      newValue: input.newValue,
      mfa: true,
      time: new Date().toISOString(),
    }),
  });
}

export function canPerformTimelineExport(settings: IncidentTimelineSettings): { allowed: boolean; reason?: string } {
  if (!settings.requireMfaForExport) return { allowed: false, reason: "MFA required for timeline exports" };
  return { allowed: true };
}

export function canAccessIncidentTimeline(): { allowed: boolean; reason?: string } {
  return { allowed: true };
}
