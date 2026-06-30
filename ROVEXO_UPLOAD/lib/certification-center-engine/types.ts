export type CertificationStatus = "passed" | "information" | "warning" | "critical" | "blocking";

export type CertificationLevel =
  | "draft"
  | "internal-review"
  | "qa-approved"
  | "security-approved"
  | "compliance-approved"
  | "release-candidate"
  | "production-ready"
  | "certified"
  | "revoked"
  | "archived";

export type CertificationModuleId =
  | "enterprise-core"
  | "mission-control"
  | "platform-studio"
  | "theme-studio"
  | "visual-cms"
  | "asset-manager"
  | "recovery-center"
  | "operations-center"
  | "security-engine"
  | "orders-engine"
  | "shipping-engine"
  | "wallet-engine"
  | "payments-engine"
  | "protection-engine"
  | "messages-engine"
  | "notifications-engine"
  | "analytics-engine"
  | "search-engine"
  | "ai-engine"
  | "integrations-engine"
  | "audit-compliance-center"
  | "homepage-enterprise-certification-engine"
  | "omega-global-ui-integrity-engine"
  | "enterprise-launch-readiness-engine"
  | "enterprise-marketplace-completion-engine"
  | "enterprise-category-management-center";

export type CertificationModuleResult = {
  id: CertificationModuleId;
  label: string;
  icon: string;
  score: number;
  status: CertificationStatus;
  certified: boolean;
  href?: string;
};

export type CertificationScorecard = {
  security: number;
  performance: number;
  accessibility: number;
  compliance: number;
  reliability: number;
  scalability: number;
  maintainability: number;
  observability: number;
  marketplaceHealth: number;
  overallEnterpriseScore: number;
};

export type CertificationDashboard = {
  overallStatus: CertificationLevel;
  productionReadiness: number;
  complianceReadiness: number;
  securityReadiness: number;
  performanceReadiness: number;
  infrastructureReadiness: number;
  recoveryReadiness: number;
  aiReadiness: number;
  marketplaceReadiness: number;
  finalRiskScore: number;
};

export type ReleaseValidationCheck = {
  id: string;
  label: string;
  category: string;
  passed: boolean;
  detail?: string;
};

export type CertificationApprovalStage =
  | "draft"
  | "review"
  | "technical-approval"
  | "security-approval"
  | "compliance-approval"
  | "executive-approval"
  | "production-certification"
  | "archive";

export type CertificationApproval = {
  id: string;
  stage: CertificationApprovalStage;
  status: "pending" | "approved" | "rejected";
  actor?: string;
  timestamp?: string;
  notes?: string;
};

export type CertificationHistoryEntry = {
  id: string;
  certificationVersion: string;
  platformVersion: string;
  buildNumber: string;
  administrator: string;
  level: CertificationLevel;
  modulesIncluded: number;
  issuesFound: number;
  issuesResolved: number;
  certificationExpiry?: string;
  rollbackAvailable: boolean;
  createdAt: string;
  timeline: { id: string; action: string; timestamp: string; actor?: string }[];
};

export type CertificationReport = {
  id: string;
  label: string;
  type:
    | "executive-summary"
    | "technical"
    | "security"
    | "compliance"
    | "infrastructure"
    | "performance"
    | "marketplace"
    | "production-certification";
  generatedAt: string;
  format: "pdf" | "csv" | "json" | "markdown";
  status: "ready" | "generating";
};

export type CertificationSchedule = {
  enabled: boolean;
  manualValidation: boolean;
  scheduledValidation: boolean;
  nightlyValidation: boolean;
  preReleaseValidation: boolean;
  continuousMonitoring: boolean;
  nextRunAt?: string;
};

export type CertificationEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type CertificationEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: CertificationEngineDocument;
  rollbackAvailable: boolean;
};

export type CertificationEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: Record<CertificationModuleId, boolean>;
  releaseValidation: {
    productionBuild: boolean;
    typecheck: boolean;
    unitTests: boolean;
    integrationTests: boolean;
    endToEndTests: boolean;
    accessibility: boolean;
    seo: boolean;
    performance: boolean;
    security: boolean;
    compliance: boolean;
    infrastructure: boolean;
    monitoring: boolean;
    backups: boolean;
    recovery: boolean;
    healthChecks: boolean;
  };
  workflow: {
    draft: boolean;
    review: boolean;
    technicalApproval: boolean;
    securityApproval: boolean;
    complianceApproval: boolean;
    executiveApproval: boolean;
    productionCertification: boolean;
    archive: boolean;
  };
  security: {
    superAdminRunCertification: boolean;
    superAdminApprove: boolean;
    superAdminRevoke: boolean;
    superAdminExport: boolean;
    superAdminSchedule: boolean;
    superAdminModifyRules: boolean;
    auditProtected: boolean;
  };
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: CertificationEngineAuditEntry[];
};

export type CertificationEngineSnapshot = {
  scannedAt: string;
  dashboard: CertificationDashboard;
  scorecard: CertificationScorecard;
  modules: CertificationModuleResult[];
  validations: ReleaseValidationCheck[];
  approvals: CertificationApproval[];
  history: CertificationHistoryEntry[];
  reports: CertificationReport[];
  schedule: CertificationSchedule;
  recommendations: string[];
  draft: CertificationEngineDocument;
  live: CertificationEngineDocument;
  configHistory: CertificationEngineHistoryEntry[];
};
