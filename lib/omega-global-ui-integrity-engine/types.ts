import type {
  CATEGORY_GLOBAL_CHECKS,
  EXECUTION_TRIGGERS,
  EXPORT_FORMATS,
  GLOBAL_CERTIFICATION_SCORES,
  GLOBAL_FAIL_CONDITIONS,
  GLOBAL_SCREEN_REGISTRY,
  GLOBAL_UI_CHECKS,
  GLOBAL_UI_DOMAINS,
  GLOBAL_UX_CHECKS,
  LAYOUT_OPTIMIZATION_TARGETS,
  NAVIGATION_CHECKS,
  PRODUCTION_PASS_REQUIREMENTS,
  REPORT_TYPES,
} from "@/lib/omega-global-ui-integrity-engine/registry";
import type { IntegrityScanResult } from "@/lib/homepage-category-integrity-engine/types";

export type GlobalUiIntegrityTab =
  | "dashboard"
  | "screens"
  | "ui-validation"
  | "ux-validation"
  | "navigation"
  | "categories"
  | "layout"
  | "auto-repair"
  | "certification"
  | "reports";

export type ExecutionTrigger = (typeof EXECUTION_TRIGGERS)[number];
export type GlobalUiDomain = (typeof GLOBAL_UI_DOMAINS)[number];
export type GlobalScreenId = (typeof GLOBAL_SCREEN_REGISTRY)[number]["id"];
export type GlobalUiCheck = (typeof GLOBAL_UI_CHECKS)[number];
export type GlobalUxCheck = (typeof GLOBAL_UX_CHECKS)[number];
export type NavigationCheck = (typeof NAVIGATION_CHECKS)[number];
export type CategoryGlobalCheck = (typeof CATEGORY_GLOBAL_CHECKS)[number];
export type LayoutOptimizationTarget = (typeof LAYOUT_OPTIMIZATION_TARGETS)[number];
export type GlobalCertificationScoreKey = (typeof GLOBAL_CERTIFICATION_SCORES)[number];
export type GlobalFailCondition = (typeof GLOBAL_FAIL_CONDITIONS)[number];
export type ProductionPassRequirement = (typeof PRODUCTION_PASS_REQUIREMENTS)[number];
export type GlobalUiIntegrityReportType = (typeof REPORT_TYPES)[number];
export type GlobalUiIntegrityExportFormat = (typeof EXPORT_FORMATS)[number];
export type GlobalUiIntegrityStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked";

export type GlobalUiIntegrityDashboard = {
  overallPassPercent: number;
  screensCertified: number;
  screensTotal: number;
  openIssues: number;
  certificationGranted: boolean;
  productionReady: boolean;
  launchReady: boolean;
  enterpriseScore: number;
  lastCertifiedAt?: string;
  lastScanAt?: string;
};

export type GlobalCertificationScore = {
  key: GlobalCertificationScoreKey;
  label: string;
  score: number;
  status: GlobalUiIntegrityStatus;
  weight: number;
};

export type ScreenCertification = {
  id: string;
  screenId: GlobalScreenId;
  label: string;
  domain: GlobalUiDomain;
  route: string;
  componentRef: string;
  overallPassPercent: number;
  status: GlobalUiIntegrityStatus;
  scores: GlobalCertificationScore[];
  lastValidatedAt: string;
};

export type UiValidationItem = {
  id: string;
  check: GlobalUiCheck;
  label: string;
  status: GlobalUiIntegrityStatus;
  findings: number;
  lastValidatedAt: string;
};

export type UxValidationItem = {
  id: string;
  check: GlobalUxCheck;
  label: string;
  status: GlobalUiIntegrityStatus;
  lastValidatedAt: string;
};

export type NavigationValidationItem = {
  id: string;
  check: NavigationCheck;
  label: string;
  status: GlobalUiIntegrityStatus;
  chainComplete: boolean;
  lastValidatedAt: string;
};

export type CategoryGlobalValidationItem = {
  id: string;
  check: CategoryGlobalCheck;
  label: string;
  status: GlobalUiIntegrityStatus;
  findings: number;
  lastValidatedAt: string;
};

export type LayoutOptimizationItem = {
  id: string;
  target: LayoutOptimizationTarget;
  label: string;
  status: GlobalUiIntegrityStatus;
  measuredValue?: string;
  targetValue?: string;
  lastValidatedAt: string;
};

export type AutoRepairAction = {
  id: string;
  action: string;
  target: string;
  screenId?: GlobalScreenId;
  safe: boolean;
  requiresApproval: boolean;
  status: GlobalUiIntegrityStatus;
  message: string;
  executedAt?: string;
};

export type GlobalIntegrityFailure = {
  id: string;
  condition: GlobalFailCondition;
  issue: string;
  screenId?: GlobalScreenId;
  severity: "low" | "medium" | "high" | "critical";
  recommendedFix: string;
  validationOnly: boolean;
  status: GlobalUiIntegrityStatus;
};

export type GlobalIntegrityScanResult = {
  trigger: ExecutionTrigger;
  scannedAt: string;
  passPercent: number;
  status: GlobalUiIntegrityStatus;
  homepageIntegrity: IntegrityScanResult;
  failConditions: GlobalFailCondition[];
  certificationEligible: boolean;
  productionReady: boolean;
};

export type GlobalUiIntegrityReport = {
  id: string;
  type: GlobalUiIntegrityReportType;
  title: string;
  generatedAt: string;
  status: GlobalUiIntegrityStatus;
};

export type GlobalUiIntegrityAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: GlobalUiIntegrityStatus;
};

export type GlobalUiIntegritySettings = {
  validationOnlyMode: boolean;
  blockProtectedAreaFixes: boolean;
  autoRepairEnabled: boolean;
  requireApprovalForBusinessLogic: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
  coordinateWithCertification: boolean;
  requirePass100: boolean;
  inheritToFutureModules: boolean;
};

export type GlobalUiIntegrityState = {
  dashboard: GlobalUiIntegrityDashboard;
  omegaScores: GlobalCertificationScore[];
  screens: ScreenCertification[];
  uiValidation: UiValidationItem[];
  uxValidation: UxValidationItem[];
  navigation: NavigationValidationItem[];
  categories: CategoryGlobalValidationItem[];
  layout: LayoutOptimizationItem[];
  autoRepairActions: AutoRepairAction[];
  globalScan: GlobalIntegrityScanResult;
  failures: GlobalIntegrityFailure[];
  productionRequirements: Array<{ id: ProductionPassRequirement; label: string; passPercent: number; status: GlobalUiIntegrityStatus }>;
  reports: GlobalUiIntegrityReport[];
  auditEntries: GlobalUiIntegrityAuditEntry[];
};

export type GlobalUiIntegritySnapshot = GlobalUiIntegrityState & {
  tab: GlobalUiIntegrityTab;
  settings: GlobalUiIntegritySettings;
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical"; score: number; message: string };
};
