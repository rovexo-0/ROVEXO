import type {
  AI_VALIDATION_CHECKS,
  BUTTON_VALIDATION_STEPS,
  BUSINESS_FLOWS,
  BUYER_FLOWS,
  CERTIFICATION_PIPELINE,
  FIX_ENGINE_STAGES,
  HEALTH_SCORES,
  INTERACTIVE_ELEMENT_TYPES,
  PRIORITY_ISSUE_TYPES,
  SELLER_FLOWS,
  SUPER_ADMIN_FLOWS,
  VALIDATION_DOMAINS,
  EXPORT_FORMATS,
} from "@/lib/omega-quality-assurance-center/registry";

export type QaTab =
  | "dashboard"
  | "platform"
  | "buttons"
  | "flows"
  | "ai"
  | "fix"
  | "certification"
  | "priority"
  | "coverage"
  | "modules"
  | "reports";

export type ValidationDomain = (typeof VALIDATION_DOMAINS)[number];
export type InteractiveElementType = (typeof INTERACTIVE_ELEMENT_TYPES)[number];
export type ButtonValidationStep = (typeof BUTTON_VALIDATION_STEPS)[number];
export type BuyerFlow = (typeof BUYER_FLOWS)[number];
export type SellerFlow = (typeof SELLER_FLOWS)[number];
export type BusinessFlow = (typeof BUSINESS_FLOWS)[number];
export type SuperAdminFlow = (typeof SUPER_ADMIN_FLOWS)[number];
export type AiValidationCheck = (typeof AI_VALIDATION_CHECKS)[number];
export type FixEngineStage = (typeof FIX_ENGINE_STAGES)[number];
export type CertificationStage = (typeof CERTIFICATION_PIPELINE)[number];
export type HealthScoreKey = (typeof HEALTH_SCORES)[number];
export type PriorityIssueType = (typeof PRIORITY_ISSUE_TYPES)[number];
export type QaExportFormat = (typeof EXPORT_FORMATS)[number];
export type QaStatus = "pass" | "warning" | "fail" | "pending" | "running";

export type QaHealthMetric = {
  key: HealthScoreKey;
  label: string;
  score: number;
  status: QaStatus;
};

export type PlatformDomainValidation = {
  domain: ValidationDomain;
  label: string;
  status: QaStatus;
  coverage: number;
  lastValidatedAt: string;
  issues: number;
};

export type RegisteredButton = {
  id: string;
  label: string;
  route: string;
  elementType: InteractiveElementType;
  steps: Record<ButtonValidationStep, QaStatus>;
  overallStatus: QaStatus;
};

export type UserFlowValidation = {
  id: string;
  persona: "buyer" | "seller" | "business" | "super-admin";
  flow: string;
  steps: number;
  stepsPassed: number;
  status: QaStatus;
  lastRunAt: string;
};

export type AiValidationResult = {
  check: AiValidationCheck;
  label: string;
  status: QaStatus;
  findings: number;
};

export type FixCandidate = {
  id: string;
  issue: string;
  rootCause: string;
  fixSummary: string;
  stage: FixEngineStage;
  status: QaStatus;
  safeToDeploy: boolean;
  createdAt: string;
};

export type CertificationRecord = {
  moduleId: string;
  moduleLabel: string;
  currentStage: CertificationStage;
  stagesCompleted: CertificationStage[];
  productionReady: boolean;
  enterpriseReady: boolean;
  certificationEligible: boolean;
};

export type PriorityIssue = {
  id: string;
  type: PriorityIssueType;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  target: string;
  status: QaStatus;
  detectedAt: string;
};

export type ModuleQaStatus = {
  moduleId: string;
  label: string;
  buttonCoverage: number;
  workflowCoverage: number;
  apiCoverage: number;
  status: QaStatus;
  lastCertifiedAt?: string;
};

export type QaAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: QaStatus;
};

export type QaValidationRun = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  domainsValidated: ValidationDomain[];
  startedAt: string;
  completedAt?: string;
  passRate: number;
};

export type QaSettings = {
  priorityModeEnabled: boolean;
  autoFixEnabled: boolean;
  blockUncertifiedDeploys: boolean;
  continuousValidation: boolean;
};

export type QaDashboard = {
  platformHealth: number;
  enterpriseScore: number;
  buttonCoverage: number;
  workflowCoverage: number;
  apiCoverage: number;
  certificationRate: number;
  openIssues: number;
  fixQueue: number;
};

export type QaState = {
  dashboard: QaDashboard;
  healthMetrics: QaHealthMetric[];
  platformDomains: PlatformDomainValidation[];
  registeredButtons: RegisteredButton[];
  userFlows: UserFlowValidation[];
  aiValidations: AiValidationResult[];
  fixCandidates: FixCandidate[];
  certifications: CertificationRecord[];
  priorityIssues: PriorityIssue[];
  moduleStatuses: ModuleQaStatus[];
  validationRuns: QaValidationRun[];
  auditEntries: QaAuditEntry[];
};

export type QaSnapshot = QaState & {
  tab: QaTab;
  settings: QaSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical" | "failed"; score: number; message: string };
};
