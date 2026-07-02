export type OmegaSystemStatus = "online" | "degraded" | "offline";
export type OmegaCertificationResult = "pass" | "warning" | "fail";
export type OmegaAlertSeverity = "critical" | "high" | "medium" | "low" | "information";
export type OmegaAlertStatus = "open" | "acknowledged" | "resolved";
export type OmegaScanStatus = "idle" | "running" | "completed" | "failed";
export type OmegaReportFormat = "pdf" | "csv" | "xlsx";
export type OmegaActionId =
  | "run-scan"
  | "verify-integrity"
  | "restart-services"
  | "clear-cache"
  | "generate-report"
  | "verify-certificates"
  | "sync-data"
  | "refresh-status"
  | "emergency-mode"
  | "maintenance-mode";

export type OmegaLiveModule = {
  id: string;
  label: string;
  score: number;
  status: OmegaSystemStatus;
};

export type OmegaSystemStatusRow = {
  id: string;
  label: string;
  status: OmegaSystemStatus;
  detail: string;
};

export type OmegaGlobalHealthScore = {
  overall: number;
  platform: number;
  infrastructure: number;
  marketplace: number;
  payments: number;
  wallet: number;
  security: number;
  performance: number;
  compliance: number;
};

export type OmegaScanDefinition = {
  id: string;
  label: string;
  module: string;
};

export type OmegaScanResult = {
  id: string;
  scanId: string;
  label: string;
  status: "pass" | "warning" | "fail";
  score: number;
  durationMs: number;
  completedAt: string;
  summary: string;
};

export type OmegaGlobalScanReport = {
  id: string;
  startedAt: string;
  completedAt: string;
  overallScore: number;
  status: "pass" | "warning" | "fail";
  results: OmegaScanResult[];
  unifiedSummary: string;
};

export type OmegaAlert = {
  id: string;
  severity: OmegaAlertSeverity;
  module: string;
  title: string;
  message: string;
  status: OmegaAlertStatus;
  recommendedAction: string;
  createdAt: string;
};

export type OmegaReleaseCenter = {
  currentVersion: string;
  latestVersion: string;
  productionVersion: string;
  betaVersion: string;
  rollbackAvailable: boolean;
  deploymentStatus: string;
  releaseHealth: number;
};

export type OmegaCertificationItem = {
  id: string;
  label: string;
  status: OmegaCertificationResult;
  detail: string;
};

export type OmegaInfrastructureMetrics = {
  cpu: number;
  ram: number;
  disk: number;
  storage: number;
  bandwidth: number;
  network: number;
  latencyMs: number;
  serverAvailability: number;
  backgroundJobs: number;
  databaseConnections: number;
};

export type OmegaPerformanceMetrics = {
  responseTimeMs: number;
  apiSpeedMs: number;
  databaseQueryMs: number;
  cacheHitRate: number;
  activeSessions: number;
  transactionsPerMinute: number;
  errors: number;
  performanceScore: number;
  trend: { label: string; value: number }[];
};

export type OmegaSecurityOverview = {
  guardianStatus: string;
  sentinelStatus: string;
  antivirusStatus: string;
  threatLevel: "low" | "elevated" | "high" | "critical";
  blockedAttempts: number;
  authenticationHealth: number;
  deviceTrust: number;
  certificateStatus: string;
  encryption: string;
};

export type OmegaAnalyticsSnapshot = {
  liveUsers: number;
  activeSessions: number;
  apiRequestsPerMinute: number;
  ordersPerHour: number;
  revenueToday: number;
  conversionRate: number;
  topModules: { label: string; value: number }[];
};

export type OmegaOriInsight = {
  id: string;
  question: string;
  answer: string;
  recommendation: string;
  riskPrediction: string;
};

export type OmegaReportRecord = {
  id: string;
  type: string;
  label: string;
  format: OmegaReportFormat;
  generatedAt: string;
  sizeKb: number;
};

export type OmegaNotificationChannel = {
  id: string;
  label: string;
  enabled: boolean;
  events: string[];
};

export type OmegaEnterpriseSettings = {
  pushNotifications: boolean;
  criticalAlerts: boolean;
  securityIncidents: boolean;
  serverOffline: boolean;
  backupFailed: boolean;
  releaseFailed: boolean;
  certificateExpiring: boolean;
  infrastructureWarning: boolean;
  performanceWarning: boolean;
  emergencyMode: boolean;
  maintenanceMode: boolean;
  autoGlobalScan: boolean;
  autoGlobalScanIntervalHours: number;
};

export type OmegaEnterpriseIntegrations = {
  omega: boolean;
  guardianEnterpriseX: boolean;
  sentinelX: boolean;
  antivirusEngineX: boolean;
  ori: boolean;
  infrastructureEngine: boolean;
  disasterRecoveryEngine: boolean;
  enterpriseComplianceCenter: boolean;
  certificationCenter: boolean;
};

export type OmegaEnterpriseDashboard = {
  globalHealth: OmegaGlobalHealthScore;
  liveModules: OmegaLiveModule[];
  systemStatus: OmegaSystemStatusRow[];
  alertCounts: Record<OmegaAlertSeverity, number>;
  lastGlobalScanAt: string | null;
  lastGlobalScanScore: number | null;
  fleetSecurityScore: number;
  performanceScore: number;
};

export type OmegaEnterpriseEngineSnapshot = {
  scannedAt: string;
  dashboard: OmegaEnterpriseDashboard;
  alerts: OmegaAlert[];
  scans: OmegaGlobalScanReport[];
  latestScan: OmegaGlobalScanReport | null;
  release: OmegaReleaseCenter;
  certifications: OmegaCertificationItem[];
  infrastructure: OmegaInfrastructureMetrics;
  performance: OmegaPerformanceMetrics;
  security: OmegaSecurityOverview;
  analytics: OmegaAnalyticsSnapshot;
  oriInsights: OmegaOriInsight[];
  reports: OmegaReportRecord[];
  notifications: OmegaNotificationChannel[];
  settings: OmegaEnterpriseSettings;
  integrations: OmegaEnterpriseIntegrations;
  omegaGoldScore: number;
};
