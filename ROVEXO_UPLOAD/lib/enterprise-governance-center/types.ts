import type {
  ARCHITECTURE_CHECKS,
  COMPLIANCE_CATEGORIES,
  COMPLIANCE_STATUSES,
  CONSTITUTION_SECTIONS,
  DEBT_CATEGORIES,
  ENTERPRISE_SCORE_DOMAINS,
  CERTIFICATION_CHECKS,
  VALIDATION_PIPELINE,
  REPORT_TYPES,
  EXPORT_FORMATS,
} from "@/lib/enterprise-governance-center/registry";

export type GovernanceTab =
  | "constitution"
  | "architecture"
  | "compliance"
  | "enterprise-rules"
  | "technical-debt"
  | "enterprise-score"
  | "certification"
  | "audit"
  | "validation"
  | "reports";

export type ConstitutionSection = (typeof CONSTITUTION_SECTIONS)[number];
export type ArchitectureCheck = (typeof ARCHITECTURE_CHECKS)[number];
export type ComplianceCategory = (typeof COMPLIANCE_CATEGORIES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type DebtCategory = (typeof DEBT_CATEGORIES)[number];
export type EnterpriseScoreDomain = (typeof ENTERPRISE_SCORE_DOMAINS)[number];
export type CertificationCheck = (typeof CERTIFICATION_CHECKS)[number];
export type ValidationStage = (typeof VALIDATION_PIPELINE)[number];
export type GovernanceReportType = (typeof REPORT_TYPES)[number];
export type GovernanceExportFormat = (typeof EXPORT_FORMATS)[number];

export type ConstitutionArticle = {
  id: string;
  section: ConstitutionSection;
  title: string;
  version: string;
  summary: string;
  amendedAt?: string;
};

export type ArchitectureViolation = {
  id: string;
  check: ArchitectureCheck;
  severity: "low" | "medium" | "high";
  message: string;
  moduleId?: string;
};

export type ModuleCompliance = {
  moduleId: string;
  label: string;
  status: ComplianceStatus;
  categories: Record<ComplianceCategory, ComplianceStatus>;
};

export type EnterpriseRule = {
  id: string;
  name: string;
  scope: string;
  enabled: boolean;
  violations: number;
};

export type TechnicalDebtItem = {
  category: DebtCategory;
  score: number;
  items: number;
  trend: "up" | "down" | "stable";
};

export type EnterpriseScoreCard = {
  domain: EnterpriseScoreDomain;
  score: number;
  label: string;
};

export type EnterpriseCertificate = {
  id: string;
  issuedAt: string;
  signedBy: string;
  signature: string;
  immutable: boolean;
  checksPassed: number;
  checksTotal: number;
};

export type GovernanceAuditEntry = {
  id: string;
  type: "architecture" | "rule" | "config" | "deployment" | "ai" | "security" | "user" | "approval" | "rollback";
  action: string;
  actor: string;
  target: string;
  timestamp: string;
};

export type ValidationRun = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  currentStage?: ValidationStage;
  stagesCompleted: ValidationStage[];
  startedAt: string;
  completedAt?: string;
};

export type GovernanceSettings = {
  mfaRequiredForCertify: boolean;
  autoValidationEnabled: boolean;
  constitutionVersion: string;
};

export type GovernanceState = {
  constitution: ConstitutionArticle[];
  architectureViolations: ArchitectureViolation[];
  moduleCompliance: ModuleCompliance[];
  rules: EnterpriseRule[];
  technicalDebt: TechnicalDebtItem[];
  enterpriseScores: EnterpriseScoreCard[];
  certificates: EnterpriseCertificate[];
  auditEntries: GovernanceAuditEntry[];
  validationRuns: ValidationRun[];
  amendments: Array<{ id: string; section: ConstitutionSection; date: string; summary: string }>;
};

export type GovernanceSnapshot = {
  tab: GovernanceTab;
  constitution: ConstitutionArticle[];
  architectureViolations: ArchitectureViolation[];
  moduleCompliance: ModuleCompliance[];
  rules: EnterpriseRule[];
  technicalDebt: TechnicalDebtItem[];
  enterpriseScores: EnterpriseScoreCard[];
  overallScore: number;
  certificates: EnterpriseCertificate[];
  auditEntries: GovernanceAuditEntry[];
  validationRuns: ValidationRun[];
  amendments: GovernanceState["amendments"];
  settings: GovernanceSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
