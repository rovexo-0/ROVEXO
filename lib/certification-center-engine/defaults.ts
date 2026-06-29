import type {
  CertificationApproval,
  CertificationEngineDocument,
  CertificationEngineHistoryEntry,
  CertificationHistoryEntry,
  CertificationSchedule,
} from "@/lib/certification-center-engine/types";
import { CERTIFICATION_MODULES } from "@/lib/certification-center-engine/registry";

const now = () => new Date().toISOString();

export function createDefaultCertificationCenterEngineDocument(
  label = "ROVEXO Certification Center",
): CertificationEngineDocument {
  const modules = Object.fromEntries(CERTIFICATION_MODULES.map((m) => [m.id, true])) as CertificationEngineDocument["modules"];

  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    modules,
    releaseValidation: {
      productionBuild: true,
      typecheck: true,
      unitTests: true,
      integrationTests: true,
      endToEndTests: true,
      accessibility: true,
      seo: true,
      performance: true,
      security: true,
      compliance: true,
      infrastructure: true,
      monitoring: true,
      backups: true,
      recovery: true,
      healthChecks: true,
    },
    workflow: {
      draft: true,
      review: true,
      technicalApproval: true,
      securityApproval: true,
      complianceApproval: true,
      executiveApproval: true,
      productionCertification: true,
      archive: true,
    },
    security: {
      superAdminRunCertification: true,
      superAdminApprove: true,
      superAdminRevoke: true,
      superAdminExport: true,
      superAdminSchedule: true,
      superAdminModifyRules: true,
      auditProtected: true,
    },
    integrations: {
      missionControl: true,
      enterpriseCore: true,
      auditCenter: true,
      complianceCenter: true,
      operationsCenter: true,
      recoveryCenter: true,
      securityCenter: true,
      platformStudio: true,
      themeStudioPro: true,
      visualCms: true,
      developerCenter: true,
      globalSearch: true,
    },
    futureReady: ["Signed release attestations", "Immutable certification ledger"],
    auditLog: [],
  };
}

export function createDefaultCertificationCenterEngineHistory(): CertificationEngineHistoryEntry[] {
  return [];
}

export function createDefaultCertificationApprovals(): CertificationApproval[] {
  return [
    { id: "ap-draft", stage: "draft", status: "approved", actor: "system", timestamp: now() },
    { id: "ap-review", stage: "review", status: "pending" },
    { id: "ap-technical", stage: "technical-approval", status: "pending" },
    { id: "ap-security", stage: "security-approval", status: "pending" },
    { id: "ap-compliance", stage: "compliance-approval", status: "pending" },
    { id: "ap-executive", stage: "executive-approval", status: "pending" },
    { id: "ap-production", stage: "production-certification", status: "pending" },
  ];
}

export function createDefaultCertificationHistory(): CertificationHistoryEntry[] {
  return [
    {
      id: "cert-initial",
      certificationVersion: "cert-v1.0",
      platformVersion: "ROVEXO v1.0",
      buildNumber: "build-local",
      administrator: "system",
      level: "release-candidate",
      modulesIncluded: 21,
      issuesFound: 0,
      issuesResolved: 0,
      rollbackAvailable: true,
      createdAt: now(),
      timeline: [{ id: "created", action: "Initial certification baseline", timestamp: now(), actor: "system" }],
    },
  ];
}

export function createDefaultCertificationSchedule(): CertificationSchedule {
  return {
    enabled: true,
    manualValidation: true,
    scheduledValidation: true,
    nightlyValidation: true,
    preReleaseValidation: true,
    continuousMonitoring: true,
    nextRunAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
  };
}
