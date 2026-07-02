import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditEnterpriseComplianceAction,
  canModifyRetentionPolicy,
  canPerformComplianceExport,
} from "@/lib/enterprise-compliance-center-engine/audit";
import {
  ENTERPRISE_COMPLIANCE_CENTER_EXPORTS_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY,
  ENTERPRISE_COMPLIANCE_PRE_AUDIT_RUNS_KEY,
  ENTERPRISE_COMPLIANCE_READINESS_HISTORY_KEY,
  ENTERPRISE_COMPLIANCE_REMEDIATION_KEY,
} from "@/lib/enterprise-compliance-center-engine/keys";
import { COMPLIANCE_EXPORT_TYPES } from "@/lib/enterprise-compliance-center-engine/registry";
import type {
  ComplianceExportRecord,
  EnterpriseComplianceSettings,
  PreAuditSimulation,
  RemediationItem,
  RetentionPolicy,
} from "@/lib/enterprise-compliance-center-engine/types";
import { executeOmegaEnterpriseAction } from "@/lib/omega-enterprise-mobile-engine/engine";
import { runEnterpriseAudit } from "@/lib/audit-compliance-engine/engine";
import { fetchEnterpriseComplianceLiveContext } from "@/lib/enterprise-compliance-center-engine/live";
import { buildGapAnalysis, runPreAuditSimulation } from "@/lib/enterprise-compliance-center-engine/readiness";

export type ReadinessHistoryEntry = { score: number; recordedAt: string };

export function createDefaultEnterpriseComplianceSettings(): EnterpriseComplianceSettings {
  return {
    retentionDays: 365,
    archivePolicy: "auto-archive",
    deletionPolicy: "soft-delete",
    legalHold: false,
    automaticExport: true,
    scheduledExport: true,
    encryptedExport: true,
    exportFormats: ["pdf", "csv", "xlsx", "json"],
    requireMfaForExport: true,
    requireBiometricForPolicyChange: true,
    appendOnlyAudit: true,
    liveRefreshSeconds: 60,
  };
}

export async function getEnterpriseComplianceSettings(): Promise<EnterpriseComplianceSettings> {
  const { enterpriseComplianceConfigLifecycle } = await import("@/lib/enterprise-compliance-center-engine/config");
  const live = await enterpriseComplianceConfigLifecycle.readLive();
  return live.settings;
}

export async function getEnterpriseComplianceExports(): Promise<ComplianceExportRecord[]> {
  return getPlatformSetting(ENTERPRISE_COMPLIANCE_CENTER_EXPORTS_KEY, []);
}

export async function getPreAuditHistory(): Promise<PreAuditSimulation[]> {
  return getPlatformSetting(ENTERPRISE_COMPLIANCE_PRE_AUDIT_RUNS_KEY, []);
}

export async function getReadinessHistory(): Promise<ReadinessHistoryEntry[]> {
  return getPlatformSetting(ENTERPRISE_COMPLIANCE_READINESS_HISTORY_KEY, []);
}

export async function getRemediationOverrides(): Promise<Record<string, Partial<RemediationItem>>> {
  return getPlatformSetting(ENTERPRISE_COMPLIANCE_REMEDIATION_KEY, {});
}

export async function executeEnterpriseComplianceAction(
  action: string,
  actorId: string,
  payload?: {
    format?: "pdf" | "csv" | "xlsx" | "json";
    exportId?: string;
    retention?: Partial<RetentionPolicy>;
    document?: import("@/lib/enterprise-compliance-center-engine/config").EnterpriseComplianceConfigDocument;
    historyId?: string;
  },
): Promise<void> {
  const { isEnterpriseComplianceConfigAction, executeEnterpriseComplianceConfigAction } = await import(
    "@/lib/enterprise-compliance-center-engine/config-actions"
  );
  if (isEnterpriseComplianceConfigAction(action)) {
    await executeEnterpriseComplianceConfigAction(action, actorId, payload);
    return;
  }

  const settings = await getEnterpriseComplianceSettings();

  if (action === "verify-integrity") {
    await executeOmegaEnterpriseAction("run-scan", actorId);
    await runEnterpriseAudit({ scope: "full" }, actorId);
  } else if (action === "run-pre-audit") {
    const ctx = await fetchEnterpriseComplianceLiveContext();
    const gaps = buildGapAnalysis(ctx);
    const simulation = runPreAuditSimulation(ctx, gaps);
    const history = await getPreAuditHistory();
    await updatePlatformSetting({
      actorId,
      key: ENTERPRISE_COMPLIANCE_PRE_AUDIT_RUNS_KEY,
      value: [simulation, ...history].slice(0, 20) as unknown as Json,
    });
    const readinessHistory = await getReadinessHistory();
    await updatePlatformSetting({
      actorId,
      key: ENTERPRISE_COMPLIANCE_READINESS_HISTORY_KEY,
      value: [{ score: simulation.estimatedReadiness, recordedAt: simulation.runAt }, ...readinessHistory].slice(0, 30) as unknown as Json,
    });
  } else if (action === "update-retention") {
    const permission = canModifyRetentionPolicy(settings);
    if (!permission.allowed) throw new Error(permission.reason ?? "Policy change not allowed");
    const next = { ...settings, ...payload?.retention };
    await updatePlatformSetting({ actorId, key: ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY, value: next as unknown as Json });
  } else if (action === "export" || action.startsWith("export-")) {
    const permission = canPerformComplianceExport(settings);
    if (!permission.allowed) throw new Error(permission.reason ?? "Export not allowed");

    const exportDef =
      COMPLIANCE_EXPORT_TYPES.find((e) => e.id === payload?.exportId) ??
      COMPLIANCE_EXPORT_TYPES.find((e) => e.format === (payload?.format ?? "pdf")) ??
      COMPLIANCE_EXPORT_TYPES[0]!;

    const exports = await getEnterpriseComplianceExports();
    const record: ComplianceExportRecord = {
      id: `ecc-export-${Date.now().toString(36)}`,
      label: exportDef.label,
      format: payload?.format ?? exportDef.format,
      generatedAt: new Date().toISOString(),
      generatedBy: actorId,
    };
    await updatePlatformSetting({
      actorId,
      key: ENTERPRISE_COMPLIANCE_CENTER_EXPORTS_KEY,
      value: [record, ...exports].slice(0, 30) as unknown as Json,
    });
  } else {
    throw new Error("Unknown action");
  }

  await auditEnterpriseComplianceAction({ actorId, action, exportId: payload?.exportId, newValue: payload });
}
