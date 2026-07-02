export type RecoveryStatus = "healthy" | "warning" | "degraded" | "critical" | "offline";

export type RecoveryBackupType =
  | "full"
  | "database"
  | "media"
  | "assets"
  | "theme"
  | "configuration"
  | "environment"
  | "api"
  | "security"
  | "integrations"
  | "incremental";

export type RecoveryBackupEntry = {
  id: string;
  label: string;
  type: RecoveryBackupType;
  createdAt: string;
  scheduled: boolean;
  encrypted: boolean;
  incremental: boolean;
  sizeLabel?: string;
  status: "completed" | "running" | "failed" | "verified";
  rollbackAvailable: boolean;
};

export type RecoveryHistoryEntry = {
  id: string;
  label: string;
  type: "backup" | "restore" | "rollback" | "safe-mode" | "disaster" | "validation";
  module?: string;
  createdAt: string;
  durationMs?: number;
  result: "success" | "failed" | "pending";
  validated: boolean;
  rollbackReference?: string;
  actor?: string;
};

export type RecoveryRollbackTarget = {
  id: string;
  label: string;
  icon: string;
  module: string;
  rollbackAvailable: boolean;
  lastSnapshotAt?: string;
};

export type RecoveryAlert = {
  id: string;
  title: string;
  category: string;
  priority: "information" | "warning" | "critical";
  status: "open" | "resolved";
  createdAt: string;
};

export type RecoveryIncident = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "archived";
  owner?: string;
  notes?: string;
  checklist: string[];
  createdAt: string;
  updatedAt: string;
  timeline: { id: string; action: string; timestamp: string; actor?: string }[];
};

export type RecoverySafeModeState = {
  enabled: boolean;
  readOnlyMarketplace: boolean;
  disablePublishing: boolean;
  disableAdminEditing: boolean;
  disableIntegrations: boolean;
  disableScheduledJobs: boolean;
  disableAi: boolean;
  disableExternalApis: boolean;
  emergencyHomepage: boolean;
  message: string;
};

export type RecoveryBusinessContinuity = {
  rtoMinutes: number;
  rpoMinutes: number;
  backupIntegrity: RecoveryStatus;
  replicationStatus: RecoveryStatus;
  failoverReadiness: RecoveryStatus;
  serviceAvailability: RecoveryStatus;
  disasterReadiness: RecoveryStatus;
};

export type RecoveryMonitorMetric = {
  id: string;
  label: string;
  value: string | number;
  status: RecoveryStatus;
};

export type RecoveryDashboardWidget = {
  id: string;
  label: string;
  value: string | number;
  status: RecoveryStatus;
};

export type RecoveryAutomationAction = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type RecoveryEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type RecoveryEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: RecoveryEngineDocument;
  rollbackAvailable: boolean;
};

export type RecoveryEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  backupCenter: {
    fullPlatform: boolean;
    database: boolean;
    media: boolean;
    assets: boolean;
    theme: boolean;
    configuration: boolean;
    environment: boolean;
    scheduled: boolean;
    manual: boolean;
    encrypted: boolean;
    incremental: boolean;
  };
  disasterRecovery: {
    safeRecovery: boolean;
    emergencyRestore: boolean;
    partialRestore: boolean;
    completeRestore: boolean;
    validation: boolean;
  };
  automation: {
    automaticBackup: boolean;
    automaticVerification: boolean;
    automaticRollbackValidation: boolean;
    automaticRestoreValidation: boolean;
    automaticIntegrityScan: boolean;
    automaticHealthCheck: boolean;
    automaticAlerts: boolean;
  };
  security: {
    superAdminRestore: boolean;
    superAdminRollback: boolean;
    superAdminDeleteBackups: boolean;
    superAdminExportBackups: boolean;
    superAdminEmergency: boolean;
    superAdminSafeMode: boolean;
    superAdminDisasterRecovery: boolean;
    auditProtected: boolean;
  };
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: RecoveryEngineAuditEntry[];
};

export type RecoveryEngineDashboard = {
  recoveryReadinessScore: number;
  backupHealth: RecoveryStatus;
  disasterRecoveryStatus: RecoveryStatus;
  rollbackAvailable: boolean;
  emergencyModeEnabled: boolean;
  activeIncidents: number;
  maintenanceEnabled: boolean;
};

export type RecoveryEngineSnapshot = {
  scannedAt: string;
  platformStatus: RecoveryStatus;
  dashboard: RecoveryEngineDashboard;
  widgets: RecoveryDashboardWidget[];
  backups: RecoveryBackupEntry[];
  history: RecoveryHistoryEntry[];
  rollbackTargets: RecoveryRollbackTarget[];
  alerts: RecoveryAlert[];
  incidents: RecoveryIncident[];
  safeMode: RecoverySafeModeState;
  businessContinuity: RecoveryBusinessContinuity;
  monitor: RecoveryMonitorMetric[];
  automation: RecoveryAutomationAction[];
  draft: RecoveryEngineDocument;
  live: RecoveryEngineDocument;
  configHistory: RecoveryEngineHistoryEntry[];
};
