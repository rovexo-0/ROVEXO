import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import type { EnterpriseComplianceSettings } from "@/lib/enterprise-compliance-center-engine/types";

export async function auditEnterpriseComplianceAction(input: {
  actorId: string;
  action: string;
  exportId?: string;
  newValue?: unknown;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "enterprise_compliance_center.change",
    resourceType: "enterprise_compliance_center",
    resourceId: input.exportId ?? "enterprise-compliance-center",
    metadata: toAuditLogMetadata({
      action: input.action,
      exportId: input.exportId,
      newValue: input.newValue,
      mfa: true,
      time: new Date().toISOString(),
    }),
  });
}

export function canPerformComplianceExport(settings: EnterpriseComplianceSettings): { allowed: boolean; reason?: string } {
  if (!settings.requireMfaForExport) return { allowed: false, reason: "MFA required for compliance exports" };
  return { allowed: true };
}

export function canModifyRetentionPolicy(settings: EnterpriseComplianceSettings): { allowed: boolean; reason?: string } {
  if (!settings.requireMfaForExport) return { allowed: false, reason: "MFA required for policy changes" };
  if (!settings.requireBiometricForPolicyChange) return { allowed: false, reason: "Biometric confirmation required for retention policy changes" };
  return { allowed: true };
}
