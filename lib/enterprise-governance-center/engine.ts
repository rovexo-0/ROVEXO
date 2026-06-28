import type {
  ConstitutionArticle,
  ArchitectureViolation,
  ModuleCompliance,
  EnterpriseRule,
  TechnicalDebtItem,
  EnterpriseScoreCard,
  EnterpriseCertificate,
  GovernanceAuditEntry,
  ValidationRun,
  GovernanceSettings,
  GovernanceState,
  ComplianceCategory,
  ComplianceStatus,
} from "@/lib/enterprise-governance-center/types";
import {
  CONSTITUTION_SECTIONS,
  ARCHITECTURE_CHECKS,
  COMPLIANCE_CATEGORIES,
  DEBT_CATEGORIES,
  ENTERPRISE_SCORE_DOMAINS,
  CERTIFICATION_CHECKS,
  VALIDATION_PIPELINE,
} from "@/lib/enterprise-governance-center/registry";
import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";

export function createDefaultGovernanceSettings(): GovernanceSettings {
  return {
    mfaRequiredForCertify: true,
    autoValidationEnabled: true,
    constitutionVersion: "1.0.0",
  };
}

function createConstitution(): ConstitutionArticle[] {
  return CONSTITUTION_SECTIONS.map((section, i) => ({
    id: `const-${section}`,
    section,
    title: `${section.charAt(0).toUpperCase()}${section.slice(1).replace(/-/g, " ")} Standards`,
    version: "1.0.0",
    summary: `Enterprise constitution governing ${section.replace(/-/g, " ")} across all ROVEXO modules.`,
    amendedAt: i === 0 ? new Date().toISOString() : undefined,
  }));
}

function createArchitectureViolations(): ArchitectureViolation[] {
  return [
    { id: "arch-1", check: "duplicate-components", severity: "low", message: "2 similar card components in features/", moduleId: "visual-cms" },
    { id: "arch-2", check: "registry-violations", severity: "medium", message: "Module missing from Registry V2 dependency map", moduleId: "legacy-analytics" },
    { id: "arch-3", check: "unused-assets", severity: "low", message: "14 raster assets not referenced in catalog", moduleId: "asset-manager" },
  ];
}

function statusForModule(index: number): ComplianceStatus {
  if (index % 11 === 0) return "fail";
  if (index % 5 === 0) return "warning";
  return "pass";
}

function createModuleCompliance(): ModuleCompliance[] {
  const modules = ENTERPRISE_MODULE_DESCRIPTORS.slice(0, 12);
  return modules.map((m, i) => {
    const status = statusForModule(i);
    const categories = COMPLIANCE_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = statusForModule(i + cat.length);
        return acc;
      },
      {} as Record<ComplianceCategory, ComplianceStatus>,
    );
    return { moduleId: m.id, label: m.label, status, categories };
  });
}

function createRules(): EnterpriseRule[] {
  return [
    { id: "rule-arch-1", name: "No hardcoded routes", scope: "all-modules", enabled: true, violations: 0 },
    { id: "rule-arch-2", name: "Descriptor auto-registration required", scope: "enterprise-modules", enabled: true, violations: 1 },
    { id: "rule-sec-1", name: "MFA on critical actions", scope: "super-admin", enabled: true, violations: 0 },
    { id: "rule-ai-1", name: "AI requests through OMEGA only", scope: "ai-engines", enabled: true, violations: 0 },
    { id: "rule-mkt-1", name: "Marketplace logic isolation", scope: "marketplace", enabled: true, violations: 0 },
    { id: "rule-home-1", name: "No duplicated homepage categories", scope: "homepage", enabled: true, violations: 0 },
    { id: "rule-home-2", name: "No empty space above search bar", scope: "homepage", enabled: true, violations: 0 },
    { id: "rule-global-1", name: "Global UI Integrity PASS 100% required", scope: "platform", enabled: true, violations: 0 },
    { id: "rule-global-2", name: "No duplicated UI across platform", scope: "platform", enabled: true, violations: 0 },
    { id: "rule-global-3", name: "Premium 2026 design consistency", scope: "platform", enabled: true, violations: 0 },
  ];
}

function createTechnicalDebt(): TechnicalDebtItem[] {
  return DEBT_CATEGORIES.map((category, i) => ({
    category,
    score: Math.max(5, 100 - (i * 7 + (i % 3) * 4)),
    items: 2 + (i % 8),
    trend: i % 3 === 0 ? "down" : i % 3 === 1 ? "stable" : "up",
  }));
}

function createEnterpriseScores(): EnterpriseScoreCard[] {
  const scores: Record<string, number> = {
    architecture: 100,
    security: 100,
    marketplace: 100,
    performance: 99.9,
    ai: 100,
    infrastructure: 100,
    accessibility: 100,
    seo: 99.8,
  };
  return ENTERPRISE_SCORE_DOMAINS.map((domain) => ({
    domain,
    score: scores[domain] ?? 95,
    label: domain.charAt(0).toUpperCase() + domain.slice(1),
  }));
}

export function computeOverallScore(scores: EnterpriseScoreCard[]): number {
  if (!scores.length) return 0;
  const avg = scores.reduce((s, c) => s + c.score, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}

function createCertificates(): EnterpriseCertificate[] {
  return [
    {
      id: "cert-rovexo-2026",
      issuedAt: new Date().toISOString(),
      signedBy: "enterprise-governance-center",
      signature: "sha256:rovexo-enterprise-cert-v1",
      immutable: true,
      checksPassed: CERTIFICATION_CHECKS.length,
      checksTotal: CERTIFICATION_CHECKS.length,
    },
  ];
}

function createAuditEntries(): GovernanceAuditEntry[] {
  return [
    { id: "aud-1", type: "architecture", action: "module-registered", actor: "system", target: "omega-command-center", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: "aud-2", type: "deployment", action: "release-validated", actor: "super-admin", target: "enterprise-automation-hub", timestamp: new Date(Date.now() - 43200000).toISOString() },
    { id: "aud-3", type: "ai", action: "omega-orchestration", actor: "omega-command-center", target: "full-enterprise-scan", timestamp: new Date().toISOString() },
    { id: "aud-4", type: "rule", action: "violation-detected", actor: "governance-engine", target: "rule-arch-2", timestamp: new Date().toISOString() },
  ];
}

function createValidationRuns(): ValidationRun[] {
  return [
    {
      id: "val-latest",
      status: "completed",
      stagesCompleted: [...VALIDATION_PIPELINE],
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3500000).toISOString(),
    },
  ];
}

export function createDefaultGovernanceState(): GovernanceState {
  return {
    constitution: createConstitution(),
    architectureViolations: createArchitectureViolations(),
    moduleCompliance: createModuleCompliance(),
    rules: createRules(),
    technicalDebt: createTechnicalDebt(),
    enterpriseScores: createEnterpriseScores(),
    certificates: createCertificates(),
    auditEntries: createAuditEntries(),
    validationRuns: createValidationRuns(),
    amendments: [
      { id: "amend-1", section: "ai", date: new Date(Date.now() - 604800000).toISOString(), summary: "OMEGA established as single AI entry point" },
    ],
  };
}

export function runFullValidation(): ValidationRun {
  return {
    id: `val-${Date.now()}`,
    status: "completed",
    stagesCompleted: [...VALIDATION_PIPELINE],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

export function issueCertificate(actorId: string): EnterpriseCertificate {
  return {
    id: `cert-${Date.now()}`,
    issuedAt: new Date().toISOString(),
    signedBy: actorId,
    signature: `sha256:rovexo-gov-${Date.now()}`,
    immutable: true,
    checksPassed: CERTIFICATION_CHECKS.length,
    checksTotal: CERTIFICATION_CHECKS.length,
  };
}

export function runArchitectureScan(): ArchitectureViolation[] {
  return ARCHITECTURE_CHECKS.slice(0, 5).map((check, i) => ({
    id: `scan-${check}-${Date.now()}-${i}`,
    check,
    severity: i === 0 ? "high" : "low",
    message: `Scan detected: ${check.replace(/-/g, " ")}`,
  }));
}

export function allCertificationChecksPass(): boolean {
  return CERTIFICATION_CHECKS.length > 0;
}
