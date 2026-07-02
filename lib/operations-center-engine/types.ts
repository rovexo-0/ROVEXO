export type OperationsServiceStatus = "healthy" | "warning" | "degraded" | "critical" | "offline";

export type OperationsPlatformServiceId =
  | "platform-health"
  | "api"
  | "database"
  | "authentication"
  | "orders"
  | "wallet"
  | "payments"
  | "protection"
  | "shipping"
  | "messages"
  | "notifications"
  | "analytics"
  | "search"
  | "ai"
  | "integrations"
  | "security"
  | "asset-manager"
  | "visual-cms"
  | "theme-studio"
  | "platform-studio";

export type OperationsPlatformService = {
  id: OperationsPlatformServiceId;
  label: string;
  icon: string;
  status: OperationsServiceStatus;
  detail?: string;
  href?: string;
};

export type OperationsSystemMetric = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status: OperationsServiceStatus;
};

export type OperationsLiveCounter = {
  id: string;
  label: string;
  value: number;
  delta?: number;
};

export type OperationsAlert = {
  id: string;
  title: string;
  category: string;
  priority: "information" | "warning" | "critical";
  status: "open" | "resolved";
  createdAt: string;
};

export type OperationsIncident = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "archived";
  owner?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { id: string; action: string; timestamp: string; actor?: string }[];
};

export type OperationsLogEntry = {
  id: string;
  level: string;
  category: string;
  message: string;
  createdAt: string;
};

export type OperationsMaintenanceState = {
  enabled: boolean;
  mode: "scheduled" | "emergency" | "disabled";
  message: string;
  scheduledAt?: string;
  whitelistAdmin: boolean;
  countdownSeconds?: number;
};

export type OperationsRecoveryAction = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  dangerous: boolean;
};

export type OperationsDashboardWidget = {
  id: string;
  label: string;
  value: string | number;
  status: OperationsServiceStatus;
};

export type OperationsEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type OperationsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: OperationsEngineDocument;
  rollbackAvailable: boolean;
};

export type OperationsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  monitoring: {
    platformHealth: boolean;
    systemMonitor: boolean;
    liveCounters: boolean;
    incidentCenter: boolean;
    alertCenter: boolean;
    maintenanceCenter: boolean;
    liveLogs: boolean;
    healthChecks: boolean;
    automatedActions: boolean;
  };
  security: {
    superAdminRestart: boolean;
    superAdminMaintenance: boolean;
    superAdminRecovery: boolean;
    superAdminDeleteLogs: boolean;
    superAdminExportLogs: boolean;
    superAdminEmergency: boolean;
    auditProtected: boolean;
  };
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: OperationsEngineAuditEntry[];
};

export type OperationsEngineDashboard = {
  operationsScore: number;
  servicesHealthy: number;
  servicesTotal: number;
  openAlerts: number;
  openIncidents: number;
  maintenanceEnabled: boolean;
};

export type OperationsEngineSnapshot = {
  scannedAt: string;
  services: OperationsPlatformService[];
  systemMetrics: OperationsSystemMetric[];
  counters: OperationsLiveCounter[];
  alerts: OperationsAlert[];
  incidents: OperationsIncident[];
  logs: Record<string, OperationsLogEntry[]>;
  maintenance: OperationsMaintenanceState;
  recoveryActions: OperationsRecoveryAction[];
  widgets: OperationsDashboardWidget[];
  draft: OperationsEngineDocument;
  live: OperationsEngineDocument;
  history: OperationsEngineHistoryEntry[];
};
