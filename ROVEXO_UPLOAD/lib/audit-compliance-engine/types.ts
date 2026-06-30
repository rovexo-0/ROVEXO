export type AuditSeverity = "passed" | "information" | "warning" | "critical" | "blocking";

export type AuditModuleId =
  | "enterprise-core"
  | "mission-control"
  | "operations-center"
  | "recovery-center"
  | "security-engine"
  | "asset-manager"
  | "visual-cms"
  | "theme-studio"
  | "platform-studio"
  | "ai-engine"
  | "search-engine"
  | "integrations-engine"
  | "payments-engine"
  | "wallet-engine"
  | "orders-engine"
  | "shipping-engine"
  | "protection-engine"
  | "messages-engine"
  | "notifications-engine"
  | "analytics-engine";

export type AuditModuleResult = {
  id: AuditModuleId;
  label: string;
  icon: string;
  score: number;
  status: AuditSeverity;
  issues: number;
  warnings: number;
  href?: string;
};

export type AuditFinding = {
  id: string;
  module: string;
  category: "security" | "performance" | "accessibility" | "seo" | "compliance" | "infrastructure";
  title: string;
  severity: AuditSeverity;
  recommendation?: string;
};

export type ComplianceStandard = {
  id: string;
  label: string;
  percentage: number;
  status: AuditSeverity;
  missingEvidence: string[];
  recommendations: string[];
  certificationReady: boolean;
};

export type AuditRunEntry = {
  id: string;
  runAt: string;
  administrator: string;
  version: string;
  modulesScanned: number;
  issuesFound: number;
  issuesResolved: number;
  certificationStatus: "pending" | "ready" | "certified" | "failed";
  riskScore: number;
  durationMs: number;
};

export type AuditReport = {
  id: string;
  label: string;
  type: "production-readiness" | "security" | "performance" | "compliance" | "infrastructure" | "accessibility" | "seo" | "enterprise-certification" | "executive-summary";
  generatedAt: string;
  format: "pdf" | "csv" | "json" | "markdown";
  status: "ready" | "generating";
};

export type AuditSchedule = {
  enabled: boolean;
  nightlyValidation: boolean;
  weeklyCertificationScan: boolean;
  monthlyComplianceReport: boolean;
  continuousValidation: boolean;
  nextRunAt?: string;
};

export type AuditScoreCard = {
  platformHealth: number;
  compliance: number;
  security: number;
  performance: number;
  accessibility: number;
  infrastructure: number;
  marketplaceReadiness: number;
  productionReadiness: number;
  riskScore: number;
  activeWarnings: number;
  criticalIssues: number;
};

export type AuditEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type AuditEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: AuditEngineDocument;
  rollbackAvailable: boolean;
};

export type AuditEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: Record<AuditModuleId, boolean>;
  validation: {
    security: boolean;
    performance: boolean;
    accessibility: boolean;
    seo: boolean;
    compliance: boolean;
    infrastructure: boolean;
  };
  monitoring: {
    scheduledAudits: boolean;
    manualAudits: boolean;
    continuousValidation: boolean;
    nightlyValidation: boolean;
    weeklyCertificationScan: boolean;
    monthlyComplianceReport: boolean;
  };
  security: {
    superAdminFullAudit: boolean;
    superAdminCertification: boolean;
    superAdminExport: boolean;
    superAdminApproveCompliance: boolean;
    superAdminSchedule: boolean;
    superAdminModifyRules: boolean;
    auditProtected: boolean;
  };
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: AuditEngineAuditEntry[];
};

export type AuditEngineSnapshot = {
  scannedAt: string;
  scores: AuditScoreCard;
  modules: AuditModuleResult[];
  findings: AuditFinding[];
  compliance: ComplianceStandard[];
  runs: AuditRunEntry[];
  reports: AuditReport[];
  schedule: AuditSchedule;
  recommendations: string[];
  draft: AuditEngineDocument;
  live: AuditEngineDocument;
  history: AuditEngineHistoryEntry[];
};
