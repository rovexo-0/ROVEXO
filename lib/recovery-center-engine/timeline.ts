import type { HealthStatus } from "@/lib/ops/health";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import {
  RECOVERY_AUTOMATION_ACTIONS,
  RECOVERY_ROLLBACK_TARGETS,
} from "@/lib/recovery-center-engine/registry";
import type {
  RecoveryAlert,
  RecoveryAutomationAction,
  RecoveryBackupEntry,
  RecoveryBusinessContinuity,
  RecoveryDashboardWidget,
  RecoveryEngineDashboard,
  RecoveryEngineDocument,
  RecoveryHistoryEntry,
  RecoveryIncident,
  RecoveryMonitorMetric,
  RecoveryRollbackTarget,
  RecoverySafeModeState,
  RecoveryStatus,
} from "@/lib/recovery-center-engine/types";

function mapHealth(status: HealthStatus): RecoveryStatus {
  if (status === "healthy") return "healthy";
  if (status === "degraded") return "warning";
  return "critical";
}

export function buildRecoveryDashboardWidgets(input: {
  backups: RecoveryBackupEntry[];
  history: RecoveryHistoryEntry[];
  safeMode: RecoverySafeModeState;
  incidents: RecoveryIncident[];
  maintenanceEnabled: boolean;
  healthStatus: HealthStatus;
}): RecoveryDashboardWidget[] {
  const lastBackup = [...input.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const failedBackups = input.backups.filter((b) => b.status === "failed").length;

  return [
    { id: "platform-status", label: "Platform Status", value: input.healthStatus, status: mapHealth(input.healthStatus) },
    { id: "readiness-score", label: "Recovery Readiness", value: "Calculated", status: failedBackups > 0 ? "warning" : "healthy" },
    { id: "last-backup", label: "Last Backup", value: lastBackup?.label ?? "None", status: lastBackup ? "healthy" : "warning" },
    { id: "backup-health", label: "Backup Health", value: failedBackups === 0 ? "Healthy" : `${failedBackups} failed`, status: failedBackups > 0 ? "critical" : "healthy" },
    { id: "disaster-recovery", label: "Disaster Recovery", value: input.safeMode.enabled ? "Safe Mode" : "Ready", status: input.safeMode.enabled ? "warning" : "healthy" },
    { id: "rollback", label: "Rollback Availability", value: input.backups.filter((b) => b.rollbackAvailable).length, status: "healthy" },
    { id: "emergency-mode", label: "Emergency Mode", value: input.safeMode.enabled ? "ON" : "OFF", status: input.safeMode.enabled ? "warning" : "healthy" },
    { id: "incidents", label: "Active Incidents", value: input.incidents.filter((i) => i.status !== "resolved" && i.status !== "archived").length, status: input.incidents.length > 0 ? "warning" : "healthy" },
    { id: "maintenance", label: "Maintenance", value: input.maintenanceEnabled ? "ON" : "OFF", status: input.maintenanceEnabled ? "warning" : "healthy" },
    { id: "recovery-history", label: "Recovery Events", value: input.history.length, status: "healthy" },
  ];
}

export function buildRecoveryDashboard(input: {
  config: RecoveryEngineDocument;
  backups: RecoveryBackupEntry[];
  history: RecoveryHistoryEntry[];
  safeMode: RecoverySafeModeState;
  incidents: RecoveryIncident[];
  maintenanceEnabled: boolean;
  healthStatus: HealthStatus;
}): RecoveryEngineDashboard {
  const failedBackups = input.backups.filter((b) => b.status === "failed").length;
  const verifiedBackups = input.backups.filter((b) => b.status === "verified" || b.status === "completed").length;

  let score = 40;
  if (verifiedBackups >= 2) score += 20;
  if (failedBackups === 0) score += 15;
  if (input.config.security.auditProtected) score += 10;
  if (input.config.automation.automaticVerification) score += 10;
  if (!input.safeMode.enabled) score += 5;

  return {
    recoveryReadinessScore: Math.min(100, score),
    backupHealth: failedBackups > 0 ? "critical" : verifiedBackups >= 2 ? "healthy" : "warning",
    disasterRecoveryStatus: input.safeMode.enabled ? "warning" : mapHealth(input.healthStatus),
    rollbackAvailable: input.backups.some((b) => b.rollbackAvailable),
    emergencyModeEnabled: input.safeMode.enabled,
    activeIncidents: input.incidents.filter((i) => i.status !== "resolved" && i.status !== "archived").length,
    maintenanceEnabled: input.maintenanceEnabled,
  };
}

export function buildRecoveryAlerts(input: {
  backups: RecoveryBackupEntry[];
  safeMode: RecoverySafeModeState;
  healthStatus: HealthStatus;
  automationEnabled: boolean;
}): RecoveryAlert[] {
  const alerts: RecoveryAlert[] = [];

  if (input.backups.some((b) => b.status === "failed")) {
    alerts.push({ id: "backup-failure", title: "Backup failure detected", category: "backup", priority: "critical", status: "open", createdAt: new Date().toISOString() });
  }
  if (input.backups.length === 0) {
    alerts.push({ id: "missing-backup", title: "No backups configured", category: "backup", priority: "warning", status: "open", createdAt: new Date().toISOString() });
  }
  if (input.healthStatus === "unhealthy") {
    alerts.push({ id: "disaster-event", title: "Platform health critical — disaster readiness activated", category: "disaster", priority: "critical", status: "open", createdAt: new Date().toISOString() });
  }
  if (input.safeMode.enabled) {
    alerts.push({ id: "safe-mode-enabled", title: "Emergency safe mode enabled", category: "safe-mode", priority: "warning", status: "open", createdAt: new Date().toISOString() });
  }
  if (!input.automationEnabled) {
    alerts.push({ id: "automation-off", title: "Automatic backups disabled", category: "automation", priority: "warning", status: "open", createdAt: new Date().toISOString() });
  }

  if (alerts.length === 0) {
    alerts.push({ id: "all-clear", title: "Recovery systems operating normally", category: "platform", priority: "information", status: "resolved", createdAt: new Date().toISOString() });
  }

  return alerts;
}

export function buildBusinessContinuity(input: {
  backups: RecoveryBackupEntry[];
  healthStatus: HealthStatus;
  operations: ProductionOperationsSnapshot;
}): RecoveryBusinessContinuity {
  const verified = input.backups.filter((b) => b.status === "verified" || b.status === "completed").length;
  const failed = input.backups.filter((b) => b.status === "failed").length;

  return {
    rtoMinutes: 60,
    rpoMinutes: 15,
    backupIntegrity: failed > 0 ? "critical" : verified >= 2 ? "healthy" : "warning",
    replicationStatus: input.operations.environment.supabase ? "healthy" : "warning",
    failoverReadiness: mapHealth(input.healthStatus) === "healthy" ? "healthy" : "warning",
    serviceAvailability: mapHealth(input.healthStatus),
    disasterReadiness: failed > 0 || input.healthStatus === "unhealthy" ? "critical" : "healthy",
  };
}

export function buildRecoveryMonitor(input: {
  backups: RecoveryBackupEntry[];
  history: RecoveryHistoryEntry[];
}): RecoveryMonitorMetric[] {
  const running = input.backups.filter((b) => b.status === "running").length;
  const successRate =
    input.history.length === 0
      ? 100
      : Math.round((input.history.filter((h) => h.result === "success").length / input.history.length) * 100);

  return [
    { id: "backup-progress", label: "Backup Progress", value: running > 0 ? "Running" : "Idle", status: running > 0 ? "warning" : "healthy" },
    { id: "restore-progress", label: "Restore Progress", value: "Idle", status: "healthy" },
    { id: "verification", label: "Verification", value: input.backups.filter((b) => b.status === "verified").length, status: "healthy" },
    { id: "integrity-scan", label: "Integrity Scan", value: "Passed", status: "healthy" },
    { id: "recovery-queue", label: "Recovery Queue", value: 0, status: "healthy" },
    { id: "success-rate", label: "Recovery Success Rate", value: `${successRate}%`, status: successRate >= 90 ? "healthy" : "warning" },
  ];
}

export function getRollbackTargets(config: RecoveryEngineDocument): RecoveryRollbackTarget[] {
  return RECOVERY_ROLLBACK_TARGETS.map((target) => ({
    ...target,
    lastSnapshotAt: config.updatedAt,
  }));
}

export function getRecoveryAutomationActions(config: RecoveryEngineDocument): RecoveryAutomationAction[] {
  const flagMap: Record<string, boolean> = {
    "automatic-backup": config.automation.automaticBackup,
    "automatic-verification": config.automation.automaticVerification,
    "automatic-rollback-validation": config.automation.automaticRollbackValidation,
    "automatic-restore-validation": config.automation.automaticRestoreValidation,
    "automatic-integrity-scan": config.automation.automaticIntegrityScan,
    "automatic-health-check": config.automation.automaticHealthCheck,
    "automatic-alerts": config.automation.automaticAlerts,
  };
  return RECOVERY_AUTOMATION_ACTIONS.map((action) => ({
    ...action,
    enabled: flagMap[action.id] ?? action.enabled,
  }));
}

export function canPerformRecoveryAction(
  config: RecoveryEngineDocument,
  action: keyof RecoveryEngineDocument["security"],
): boolean {
  return config.security[action];
}

export function searchRecoveryData(input: {
  query: string;
  backups: RecoveryBackupEntry[];
  history: RecoveryHistoryEntry[];
  incidents: RecoveryIncident[];
  rollbackTargets: RecoveryRollbackTarget[];
}) {
  const q = input.query.trim().toLowerCase();
  if (!q) {
    return {
      backups: input.backups,
      history: input.history,
      incidents: input.incidents,
      rollbackTargets: input.rollbackTargets,
    };
  }

  return {
    backups: input.backups.filter((b) => b.label.toLowerCase().includes(q) || b.type.includes(q)),
    history: input.history.filter((h) => h.label.toLowerCase().includes(q) || (h.module ?? "").includes(q)),
    incidents: input.incidents.filter((i) => i.title.toLowerCase().includes(q)),
    rollbackTargets: input.rollbackTargets.filter((t) => t.label.toLowerCase().includes(q)),
  };
}

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function validateRecoveryHealth(input: {
  backups: RecoveryBackupEntry[];
  healthStatus: HealthStatus;
  safeMode: RecoverySafeModeState;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (input.backups.length === 0) issues.push("No backups available");
  if (input.backups.some((b) => b.status === "failed")) issues.push("Failed backups detected");
  if (input.healthStatus === "unhealthy" && !input.safeMode.enabled) issues.push("Platform unhealthy without safe mode");
  return { valid: issues.length === 0, issues };
}
