import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { IncidentStatus } from "@/lib/incident-command-center-engine/types";

export async function auditIncidentCommandAction(input: {
  actorId: string;
  action: string;
  incidentId?: string;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "incident_command_center.change",
    resourceType: "incident_command_center",
    resourceId: input.incidentId ?? "incident-command-center",
    metadata: toAuditLogMetadata({
      action: input.action,
      incidentId: input.incidentId,
      newValue: input.newValue,
      time: new Date().toISOString(),
    }),
  });
}

const PROTECTED_EMERGENCY_ACTIONS = new Set([
  "maintenance-mode",
  "emergency-lock",
  "disable-login",
  "pause-marketplace",
  "pause-payments",
  "pause-wallet",
  "emergency-broadcast",
]);

export function canPerformIncidentAction(input: {
  action: string;
  settings: { requireMfa: boolean; requireBiometric: boolean };
  status?: IncidentStatus;
}): { allowed: boolean; reason?: string } {
  if (PROTECTED_EMERGENCY_ACTIONS.has(input.action)) {
    if (!input.settings.requireMfa) return { allowed: false, reason: "MFA required for emergency actions" };
    if (!input.settings.requireBiometric) return { allowed: false, reason: "Biometric confirmation required" };
  }
  if (input.action === "close" && input.status === "closed") {
    return { allowed: false, reason: "Incident already closed" };
  }
  return { allowed: true };
}
