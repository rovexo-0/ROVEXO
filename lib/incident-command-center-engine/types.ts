export type IncidentSeverity = "critical" | "high" | "medium" | "low" | "information";
export type IncidentStatus = "open" | "acknowledged" | "investigating" | "escalated" | "ignored" | "resolved" | "closed";
export type IncidentRiskLevel = "critical" | "high" | "medium" | "low";

export type IncidentCategory =
  | "infrastructure"
  | "database"
  | "api"
  | "marketplace"
  | "wallet"
  | "payments"
  | "identity"
  | "authentication"
  | "security"
  | "guardian"
  | "sentinel"
  | "antivirus"
  | "ori"
  | "compliance"
  | "certification"
  | "storage"
  | "backup"
  | "recovery"
  | "network"
  | "performance"
  | "application"
  | "server"
  | "cloud"
  | "queue"
  | "jobs"
  | "cron"
  | "notifications";

export type IncidentCommandTab =
  | "dashboard"
  | "live"
  | "history"
  | "critical"
  | "security"
  | "infrastructure"
  | "payments"
  | "wallet"
  | "identity"
  | "compliance"
  | "emergency"
  | "reports"
  | "settings";

export type IncidentRecord = {
  id: string;
  incidentId: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  affectedModule: string;
  detectionTime: string;
  status: IncidentStatus;
  assignedEngine: string;
  rootCause: string;
  riskLevel: IncidentRiskLevel;
  recommendedAction: string;
  estimatedImpact: string;
  evidence: string;
  resolutionProgress: number;
  title: string;
  source: string;
  assignee?: string;
  mergedCount?: number;
};

export type IncidentDashboardCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolvedToday: number;
  open: number;
  acknowledged: number;
  ignored: number;
  escalated: number;
};

export type IncidentOriAnalysis = {
  incidentId: string;
  rootCause: string;
  impact: string;
  recommendedActions: string;
  priority: IncidentSeverity;
  resolutionDifficulty: string;
  preventiveRecommendations: string;
  confidence: "high" | "medium" | "low";
  dataNote?: string;
};

export type IncidentAnalytics = {
  incidentsToday: number;
  resolvedToday: number;
  criticalIncidents: number;
  averageResolutionMinutes: number | null;
  topIncidentTypes: { category: string; count: number }[];
  incidentTrend: { label: string; count: number }[];
  systemAvailability: number | null;
  alertDistribution: Record<IncidentSeverity, number>;
};

export type IncidentPushChannel = {
  id: string;
  label: string;
  enabled: boolean;
};

export type IncidentEmergencySettings = {
  maintenanceMode: boolean;
  emergencyLock: boolean;
  disableLogin: boolean;
  pauseMarketplace: boolean;
  pausePayments: boolean;
  pauseWallet: boolean;
  requireBiometric: boolean;
  requireMfa: boolean;
  suppressRepeatedAlerts: boolean;
  suppressWindowMinutes: number;
};

export type IncidentCommandSettings = IncidentEmergencySettings & {
  liveRefreshSeconds: number;
  autoEscalateCritical: boolean;
  pushCritical: boolean;
  pushSilent: boolean;
  pushSecurity: boolean;
  pushEmergency: boolean;
  pushMaintenance: boolean;
  pushRelease: boolean;
  pushCompliance: boolean;
  pushDevice: boolean;
};

export type IncidentStateOverride = {
  status?: IncidentStatus;
  assignee?: string;
  resolutionProgress?: number;
  updatedAt: string;
  updatedBy: string;
};

export type IncidentReportRecord = {
  id: string;
  label: string;
  format: "pdf" | "csv" | "xlsx";
  generatedAt: string;
};

export type IncidentHistoryEvent = {
  id: string;
  incidentId: string;
  action: string;
  detail: string;
  actorId: string;
  timestamp: string;
};

export type IncidentCommandSnapshot = {
  scannedAt: string;
  dashboard: IncidentDashboardCounts;
  incidents: IncidentRecord[];
  filteredIncidents: IncidentRecord[];
  oriAnalyses: IncidentOriAnalysis[];
  analytics: IncidentAnalytics;
  pushChannels: IncidentPushChannel[];
  settings: IncidentCommandSettings;
  reports: IncidentReportRecord[];
  history: IncidentHistoryEvent[];
  integrations: Record<string, boolean>;
};
