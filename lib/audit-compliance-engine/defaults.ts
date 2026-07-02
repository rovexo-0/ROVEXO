import type {
  AuditEngineDocument,
  AuditEngineHistoryEntry,
  AuditRunEntry,
  AuditSchedule,
} from "@/lib/audit-compliance-engine/types";
import { AUDIT_COMPLIANCE_MODULES } from "@/lib/audit-compliance-engine/registry";

const now = () => new Date().toISOString();

export function createDefaultAuditComplianceEngineDocument(
  label = "ROVEXO Audit & Compliance Center",
): AuditEngineDocument {
  const modules = Object.fromEntries(AUDIT_COMPLIANCE_MODULES.map((m) => [m.id, true])) as AuditEngineDocument["modules"];

  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    modules,
    validation: {
      security: true,
      performance: true,
      accessibility: true,
      seo: true,
      compliance: true,
      infrastructure: true,
    },
    monitoring: {
      scheduledAudits: true,
      manualAudits: true,
      continuousValidation: true,
      nightlyValidation: true,
      weeklyCertificationScan: true,
      monthlyComplianceReport: true,
    },
    security: {
      superAdminFullAudit: true,
      superAdminCertification: true,
      superAdminExport: true,
      superAdminApproveCompliance: true,
      superAdminSchedule: true,
      superAdminModifyRules: true,
      auditProtected: true,
    },
    integrations: {
      missionControl: true,
      enterpriseCore: true,
      operationsCenter: true,
      recoveryCenter: true,
      securityCenter: true,
      platformStudio: true,
      themeStudioPro: true,
      visualCms: true,
      developerCenter: true,
      globalSearch: true,
      complianceCenter: true,
    },
    futureReady: ["Continuous SOC 2 evidence collection", "Automated WCAG regression scans"],
    auditLog: [],
  };
}

export function createDefaultAuditComplianceEngineHistory(): AuditEngineHistoryEntry[] {
  return [];
}

export function createDefaultAuditRuns(): AuditRunEntry[] {
  return [
    {
      id: "run-initial",
      runAt: now(),
      administrator: "system",
      version: "ROVEXO v1.0",
      modulesScanned: 20,
      issuesFound: 0,
      issuesResolved: 0,
      certificationStatus: "ready",
      riskScore: 12,
      durationMs: 4200,
    },
  ];
}

export function createDefaultAuditSchedule(): AuditSchedule {
  return {
    enabled: true,
    nightlyValidation: true,
    weeklyCertificationScan: true,
    monthlyComplianceReport: true,
    continuousValidation: true,
    nextRunAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
  };
}
