export type EnterpriseComplianceTab =
  | "dashboard"
  | "readiness"
  | "pre-audit"
  | "gap-analysis"
  | "remediation"
  | "evidence"
  | "certifications"
  | "reports"
  | "history"
  | "settings"
  | "audit-timeline"
  | "compliance-timeline"
  | "change-timeline"
  | "evidence-vault"
  | "policies"
  | "retention"
  | "integrity";

export type AuditTimelineRecord = {
  id: string;
  auditId: string;
  date: string;
  time: string;
  timestamp: string;
  user: string;
  role: string;
  device: string;
  action: string;
  result: string;
  durationMs: number | null;
  module: string;
  approvalRequired: boolean;
  approvalResult: string | null;
  auditStatus: "recorded" | "verified" | "flagged";
  sourceHash: string;
};

export type ComplianceTimelineRecord = {
  id: string;
  standardId: string;
  label: string;
  progress: number;
  completedControls: number;
  pendingControls: number;
  failedControls: number;
  evidenceStatus: "complete" | "partial" | "missing";
  updatedAt: string;
  status: "passed" | "information" | "warning" | "critical" | "blocking";
};

export type ChangeTimelineRecord = {
  id: string;
  date: string;
  time: string;
  timestamp: string;
  changeType: string;
  executedBy: string;
  approvedBy: string | null;
  impact: string;
  rollbackAvailable: boolean;
  detail: string;
  module: string;
  sourceHash: string;
};

export type EvidenceVaultItem = {
  id: string;
  label: string;
  category:
    | "audit-report"
    | "incident-report"
    | "security-report"
    | "infrastructure-report"
    | "screenshot"
    | "system-log"
    | "export"
    | "compliance-document"
    | "certificate"
    | "policy"
    | "procedure"
    | "backup";
  format: "pdf" | "csv" | "xlsx" | "json" | "markdown" | "other";
  generatedAt: string;
  evidenceHash: string;
  integrityStatus: "verified" | "warning" | "failed";
  retentionExpiry: string;
  retentionStatus: "active" | "expiring" | "expired";
  source: string;
};

export type RetentionPolicy = {
  retentionDays: number;
  archivePolicy: "auto-archive" | "manual" | "disabled";
  deletionPolicy: "soft-delete" | "hard-delete" | "disabled";
  legalHold: boolean;
  automaticExport: boolean;
  scheduledExport: boolean;
  encryptedExport: boolean;
  exportFormats: Array<"pdf" | "csv" | "xlsx" | "json">;
};

export type IntegrityVerification = {
  auditRecords: "verified" | "warning" | "failed";
  evidenceFiles: "verified" | "warning" | "failed";
  timelineRecords: "verified" | "warning" | "failed";
  logIntegrity: "verified" | "warning" | "failed";
  hashValidation: "verified" | "warning" | "failed";
  signatureValidation: "verified" | "warning" | "failed";
  appendOnlyVerification: "verified" | "warning" | "failed";
  missingRecords: number;
  duplicateRecords: number;
  consistencyCheck: "consistent" | "warning" | "inconsistent";
  lastVerifiedAt: string;
  issues: string[];
};

export type CertificationDashboardItem = {
  id: string;
  label: string;
  progress: number;
  status: "ready" | "in-progress" | "pending" | "failed";
  internalAuditStatus: string;
  externalAuditStatus: string;
  completedControls: number;
  pendingControls: number;
  missingEvidence: string[];
  estimatedReadiness: number;
  targetDate: string | null;
};

export type EnterpriseDashboardMetrics = {
  overallReadiness: number;
  internalAudit: number;
  externalAudit: number;
  complianceHealth: number;
  certificationProgress: number;
  evidenceHealth: number;
  policyCoverage: number;
  openFindings: number;
  closedFindings: number;
  riskScore: number;
  remediationProgress: number;
};

export type AuditReadinessScore = {
  overall: number;
  certification: number;
  operational: number;
  compliance: number;
  evidence: number;
  documentation: number;
  currentScore: number;
  previousScore: number | null;
  trend: "up" | "down" | "stable";
  target: number;
  lastEvaluation: string;
};

export type PreAuditSimulation = {
  id: string;
  runAt: string;
  estimatedReadiness: number;
  estimatedOutcome: "pass" | "conditional" | "fail";
  verifiedFindings: string[];
  estimatedRisks: string[];
  aiRecommendations: string[];
  missingControls: string[];
  missingEvidence: string[];
  missingDocumentation: string[];
  policyGaps: string[];
  configurationGaps: string[];
  riskSummary: string;
  priorityActions: string[];
};

export type GapAnalysisItem = {
  id: string;
  category: "control" | "policy" | "procedure" | "documentation" | "evidence" | "configuration" | "process" | "task";
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  standard?: string;
  source: "verified" | "estimated";
};

export type RemediationItem = {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  owner: string;
  dueDate: string;
  estimatedEffort: string;
  estimatedRiskReduction: number;
  status: "open" | "in-progress" | "blocked" | "completed";
  completionPercent: number;
  dependencies: string[];
  gapId: string;
};

export type ComplianceHistoryEntry = {
  id: string;
  type: "audit-run" | "pre-audit" | "certification" | "export" | "integrity-check";
  label: string;
  timestamp: string;
  actor: string;
  outcome: string;
};

export type OriAuditIntelligence = {
  executiveSummary: string;
  topRisks: string[];
  priorityRecommendations: string[];
  missingEvidence: string[];
  missingControls: string[];
  trendAnalysis: string;
  readinessForecast: string;
  estimatedAuditDifficulty: "low" | "moderate" | "high" | "critical";
  verifiedFindings: string[];
  predictiveAnalysis: string[];
  confidence: "high" | "medium" | "low";
};

export type OmegaComplianceStatus = {
  auditIntegrity: "healthy" | "warning" | "critical";
  complianceStatus: "healthy" | "warning" | "critical";
  certificationProgress: number;
  evidenceCompleteness: number;
  timelineConsistency: "consistent" | "warning" | "inconsistent";
  retentionPolicies: "compliant" | "warning" | "violation";
  policyViolations: number;
  exportIntegrity: "verified" | "warning" | "failed";
  evidenceIntegrity: "verified" | "warning" | "failed";
  auditTrail: "verified" | "warning" | "failed";
  policyCoverage: number;
  documentationConsistency: "consistent" | "warning" | "inconsistent";
  controlCoverage: number;
  lastScannedAt: string;
};

export type OriComplianceAnalysis = {
  complianceSummary: string;
  missingControls: string[];
  highestRisks: string[];
  recommendedActions: string[];
  evidenceGaps: string[];
  priorityFixes: string[];
  readinessTrend: string;
  confirmedFindings: string[];
  aiRecommendations: string[];
  confidence: "high" | "medium" | "low";
};

export type CompliancePolicy = {
  id: string;
  label: string;
  category: string;
  status: "active" | "draft" | "archived";
  lastReviewedAt: string;
  owner: string;
};

export type ComplianceExportRecord = {
  id: string;
  label: string;
  format: "pdf" | "csv" | "xlsx" | "json";
  generatedAt: string;
  generatedBy?: string;
};

export type EnterpriseComplianceSettings = RetentionPolicy & {
  requireMfaForExport: boolean;
  requireBiometricForPolicyChange: boolean;
  appendOnlyAudit: boolean;
  liveRefreshSeconds: number;
};

export type EnterpriseComplianceSnapshot = {
  scannedAt: string;
  scores: {
    auditScore: number;
    complianceScore: number;
    integrityScore: number;
  };
  dashboard: EnterpriseDashboardMetrics;
  readiness: AuditReadinessScore;
  preAudit: PreAuditSimulation | null;
  preAuditHistory: PreAuditSimulation[];
  gapAnalysis: GapAnalysisItem[];
  remediation: RemediationItem[];
  history: ComplianceHistoryEntry[];
  auditTimeline: AuditTimelineRecord[];
  complianceTimeline: ComplianceTimelineRecord[];
  changeTimeline: ChangeTimelineRecord[];
  evidenceVault: EvidenceVaultItem[];
  retention: RetentionPolicy;
  integrity: IntegrityVerification;
  certifications: CertificationDashboardItem[];
  policies: CompliancePolicy[];
  oriAnalysis: OriComplianceAnalysis;
  oriAuditIntelligence: OriAuditIntelligence;
  omegaCompliance: OmegaComplianceStatus;
  exports: ComplianceExportRecord[];
  settings: EnterpriseComplianceSettings;
  integrations: Record<string, boolean>;
};

export type EnterpriseComplianceFilters = {
  dateFrom?: string;
  dateTo?: string;
  user?: string;
  module?: string;
  certification?: string;
  severity?: string;
  status?: string;
  standard?: string;
  approvalStatus?: string;
  query?: string;
};
