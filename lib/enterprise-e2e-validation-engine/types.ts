import type {
  API_VALIDATION_CHECKS,
  BUSINESS_RULE_DOMAINS,
  BUYER_FLOW_STEPS,
  COMPANY_FLOW_STEPS,
  DATABASE_VALIDATION_CHECKS,
  EXPORT_FORMATS,
  OMEGA_VALIDATION_SCORES,
  REGRESSION_STAGES,
  REPORT_TYPES,
  ROUTE_VALIDATION_CHECKS,
  SELLER_FLOW_STEPS,
  SUPER_ADMIN_MODULES,
  UI_CONTROL_TYPES,
} from "@/lib/enterprise-e2e-validation-engine/registry";

export type E2eValidationTab =
  | "dashboard"
  | "ui"
  | "routes"
  | "buyer"
  | "seller"
  | "company"
  | "super-admin"
  | "database"
  | "api"
  | "business"
  | "regression"
  | "failures"
  | "reports";

export type UiControlType = (typeof UI_CONTROL_TYPES)[number];
export type RouteValidationCheck = (typeof ROUTE_VALIDATION_CHECKS)[number];
export type BuyerFlowStep = (typeof BUYER_FLOW_STEPS)[number];
export type SellerFlowStep = (typeof SELLER_FLOW_STEPS)[number];
export type CompanyFlowStep = (typeof COMPANY_FLOW_STEPS)[number];
export type SuperAdminModule = (typeof SUPER_ADMIN_MODULES)[number];
export type DatabaseValidationCheck = (typeof DATABASE_VALIDATION_CHECKS)[number];
export type ApiValidationCheck = (typeof API_VALIDATION_CHECKS)[number];
export type BusinessRuleDomain = (typeof BUSINESS_RULE_DOMAINS)[number];
export type OmegaValidationScoreKey = (typeof OMEGA_VALIDATION_SCORES)[number];
export type RegressionStage = (typeof REGRESSION_STAGES)[number];
export type E2eReportType = (typeof REPORT_TYPES)[number];
export type E2eExportFormat = (typeof EXPORT_FORMATS)[number];
export type E2eValidationStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked";

export type E2eValidationDashboard = {
  overallPassRate: number;
  uiCoverage: number;
  workflowCoverage: number;
  apiCoverage: number;
  openFailures: number;
  regressionQueue: number;
  enterpriseScore: number;
  certificationEligible: boolean;
};

export type OmegaValidationScore = {
  key: OmegaValidationScoreKey;
  label: string;
  score: number;
  status: E2eValidationStatus;
  weight: number;
};

export type UiValidationItem = {
  id: string;
  controlType: UiControlType;
  label: string;
  route: string;
  status: E2eValidationStatus;
  lastValidatedAt: string;
};

export type RouteValidationItem = {
  id: string;
  check: RouteValidationCheck;
  route: string;
  status: E2eValidationStatus;
  details: string;
  lastValidatedAt: string;
};

export type WorkflowValidationItem = {
  id: string;
  persona: "buyer" | "seller" | "company" | "super-admin";
  step: string;
  label: string;
  status: E2eValidationStatus;
  durationMs: number;
  lastRunAt: string;
};

export type DatabaseValidationItem = {
  id: string;
  check: DatabaseValidationCheck;
  label: string;
  status: E2eValidationStatus;
  findings: number;
  lastValidatedAt: string;
};

export type ApiValidationItem = {
  id: string;
  check: ApiValidationCheck;
  endpoint: string;
  method: string;
  status: E2eValidationStatus;
  latencyMs: number;
  lastValidatedAt: string;
};

export type BusinessRuleValidationItem = {
  id: string;
  domain: BusinessRuleDomain;
  label: string;
  status: E2eValidationStatus;
  rulesPassed: number;
  rulesTotal: number;
  lastValidatedAt: string;
};

export type RegressionRun = {
  id: string;
  trigger: string;
  affectedModules: string[];
  stage: RegressionStage;
  status: E2eValidationStatus;
  passRate: number;
  startedAt: string;
  completedAt?: string;
};

export type FailureAnalysis = {
  id: string;
  rootCause: string;
  affectedModule: string;
  affectedWorkflow: string;
  severity: "critical" | "high" | "medium" | "low";
  recommendedFix: string;
  dependencies: string[];
  estimatedImpact: number;
  regressionRisk: number;
  certificationImpact: number;
  status: E2eValidationStatus;
  validationOnly: true;
};

export type E2eValidationReport = {
  id: string;
  type: E2eReportType;
  title: string;
  passRate: number;
  generatedAt: string;
  status: E2eValidationStatus;
};

export type E2eValidationAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: E2eValidationStatus;
};

export type E2eValidationSettings = {
  fullValidationEnabled: boolean;
  regressionAutoTrigger: boolean;
  validationOnlyMode: boolean;
  blockProtectedAreaFixes: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
};

export type E2eValidationState = {
  dashboard: E2eValidationDashboard;
  omegaScores: OmegaValidationScore[];
  uiValidations: UiValidationItem[];
  routeValidations: RouteValidationItem[];
  buyerFlows: WorkflowValidationItem[];
  sellerFlows: WorkflowValidationItem[];
  companyFlows: WorkflowValidationItem[];
  superAdminFlows: WorkflowValidationItem[];
  databaseValidations: DatabaseValidationItem[];
  apiValidations: ApiValidationItem[];
  businessRules: BusinessRuleValidationItem[];
  regressionRuns: RegressionRun[];
  failures: FailureAnalysis[];
  reports: E2eValidationReport[];
  auditEntries: E2eValidationAuditEntry[];
};

export type E2eValidationSnapshot = E2eValidationState & {
  tab: E2eValidationTab;
  settings: E2eValidationSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical" | "failed"; score: number; message: string };
};
