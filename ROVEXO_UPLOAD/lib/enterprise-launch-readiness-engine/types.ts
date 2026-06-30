import type {
  CACHING_CHECKS,
  CRON_CHECKS,
  DATABASE_CHECKS,
  DEPLOYMENT_CHECKS,
  EMAIL_CHECKS,
  EXECUTION_TRIGGERS,
  HEALTH_CHECKS,
  LAUNCH_BLOCKERS,
  LAUNCH_PRODUCTION_GATES,
  LAUNCH_READINESS_ROUTES,
  LAUNCH_READINESS_SCORES,
  MONITORING_CHECKS,
  OMEGA_GLOBAL_SCANS,
  PERFORMANCE_CHECKS,
  PUSH_CHECKS,
  PWA_CHECKS,
  QUEUE_CHECKS,
  REPORT_TYPES,
  SEARCH_INDEX_CHECKS,
  SECURITY_CHECKS,
  SEO_CHECKS,
  STORAGE_CHECKS,
} from "@/lib/enterprise-launch-readiness-engine/registry";

export type LaunchReadinessTab = (typeof LAUNCH_READINESS_ROUTES)[number]["id"];
export type ExecutionTrigger = (typeof EXECUTION_TRIGGERS)[number];
export type EmailCheck = (typeof EMAIL_CHECKS)[number];
export type CronCheck = (typeof CRON_CHECKS)[number];
export type QueueCheck = (typeof QUEUE_CHECKS)[number];
export type PwaCheck = (typeof PWA_CHECKS)[number];
export type PushCheck = (typeof PUSH_CHECKS)[number];
export type HealthCheck = (typeof HEALTH_CHECKS)[number];
export type PerformanceCheck = (typeof PERFORMANCE_CHECKS)[number];
export type CachingCheck = (typeof CACHING_CHECKS)[number];
export type DatabaseCheck = (typeof DATABASE_CHECKS)[number];
export type SearchIndexCheck = (typeof SEARCH_INDEX_CHECKS)[number];
export type SeoCheck = (typeof SEO_CHECKS)[number];
export type SecurityCheck = (typeof SECURITY_CHECKS)[number];
export type StorageCheck = (typeof STORAGE_CHECKS)[number];
export type DeploymentCheck = (typeof DEPLOYMENT_CHECKS)[number];
export type MonitoringCheck = (typeof MONITORING_CHECKS)[number];
export type OmegaGlobalScan = (typeof OMEGA_GLOBAL_SCANS)[number];
export type LaunchReadinessScoreKey = (typeof LAUNCH_READINESS_SCORES)[number];
export type LaunchProductionGate = (typeof LAUNCH_PRODUCTION_GATES)[number];
export type LaunchBlocker = (typeof LAUNCH_BLOCKERS)[number];
export type LaunchReadinessReportType = (typeof REPORT_TYPES)[number];

export type LaunchReadinessStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked";

export type DomainValidationItem = {
  id: string;
  check: string;
  label: string;
  category: string;
  status: LaunchReadinessStatus;
  findings: number;
  message: string;
  lastValidatedAt: string;
};

export type LaunchReadinessScoreCard = {
  key: LaunchReadinessScoreKey;
  label: string;
  score: number;
  status: LaunchReadinessStatus;
  weight: number;
};

export type LaunchProductionGateResult = {
  gate: LaunchProductionGate;
  label: string;
  passPercent: number;
  status: LaunchReadinessStatus;
};

export type LaunchBlockerResult = {
  blocker: LaunchBlocker;
  label: string;
  active: boolean;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
};

export type LaunchReadinessScanResult = {
  trigger: ExecutionTrigger;
  scannedAt: string;
  passPercent: number;
  status: LaunchReadinessStatus;
  certificationEligible: boolean;
  productionReady: boolean;
  launchReady: boolean;
  checks: DomainValidationItem[];
  scores: LaunchReadinessScoreCard[];
  productionGates: LaunchProductionGateResult[];
  blockers: LaunchBlockerResult[];
  omegaScans: { scan: OmegaGlobalScan; status: LaunchReadinessStatus; passPercent: number }[];
};

export type LaunchReadinessDashboard = {
  overallPassPercent: number;
  domainsValidated: number;
  domainsTotal: number;
  openIssues: number;
  certificationGranted: boolean;
  productionReady: boolean;
  launchReady: boolean;
  enterpriseScore: number;
  lastCertifiedAt?: string;
  lastScanAt: string;
};

export type LaunchReadinessReport = {
  id: string;
  type: LaunchReadinessReportType;
  title: string;
  generatedAt: string;
  status: LaunchReadinessStatus;
};

export type LaunchReadinessAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: LaunchReadinessStatus;
};

export type LaunchRepairAction = {
  id: string;
  action: string;
  target: string;
  safe: boolean;
  requiresApproval: boolean;
  status: LaunchReadinessStatus;
  message: string;
};

export type LaunchReadinessSettings = {
  validationOnlyMode: boolean;
  blockProtectedAreaFixes: boolean;
  autoRepairEnabled: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
  coordinateWithCertification: boolean;
  coordinateWithDeployment: boolean;
  requirePass100: boolean;
};

export type LaunchReadinessState = {
  dashboard: LaunchReadinessDashboard;
  scores: LaunchReadinessScoreCard[];
  email: DomainValidationItem[];
  cron: DomainValidationItem[];
  queue: DomainValidationItem[];
  pwa: DomainValidationItem[];
  push: DomainValidationItem[];
  healthChecks: DomainValidationItem[];
  performance: DomainValidationItem[];
  caching: DomainValidationItem[];
  database: DomainValidationItem[];
  searchIndex: DomainValidationItem[];
  seo: DomainValidationItem[];
  security: DomainValidationItem[];
  storage: DomainValidationItem[];
  deployment: DomainValidationItem[];
  monitoring: DomainValidationItem[];
  launchScan: LaunchReadinessScanResult;
  productionGates: LaunchProductionGateResult[];
  blockers: LaunchBlockerResult[];
  repairActions: LaunchRepairAction[];
  reports: LaunchReadinessReport[];
  auditEntries: LaunchReadinessAuditEntry[];
};

export type LaunchReadinessSnapshot = LaunchReadinessState & {
  tab: LaunchReadinessTab;
  settings: LaunchReadinessSettings;
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical"; score: number; message: string };
};
