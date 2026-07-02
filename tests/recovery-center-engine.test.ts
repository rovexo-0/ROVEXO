import { describe, expect, it } from "vitest";
import { createRecoveryCenterEngineAuditEntry } from "@/lib/recovery-center-engine/audit";
import { createDefaultBackups, createDefaultRecoveryCenterEngineDocument } from "@/lib/recovery-center-engine/defaults";
import {
  RECOVERY_CENTER_BACKUPS_KEY,
  RECOVERY_CENTER_ENGINE_LIVE_KEY,
  RECOVERY_CENTER_SAFE_MODE_KEY,
} from "@/lib/recovery-center-engine/keys";
import {
  RECOVERY_BACKUP_TYPES,
  RECOVERY_AUTOMATION_ACTIONS,
  RECOVERY_ROLLBACK_TARGETS,
  RECOVERY_RESTORE_TYPES,
} from "@/lib/recovery-center-engine/registry";
import {
  buildBusinessContinuity,
  buildRecoveryAlerts,
  buildRecoveryDashboard,
  buildRecoveryDashboardWidgets,
  buildRecoveryMonitor,
  canPerformRecoveryAction,
  countEnabledFlags,
  getRecoveryAutomationActions,
  getRollbackTargets,
  searchRecoveryData,
  validateRecoveryHealth,
} from "@/lib/recovery-center-engine/timeline";

const healthyHealth = "healthy" as const;
const baseBackups = createDefaultBackups();
const baseHistory = [
  { id: "rh-1", label: "Configuration restore", type: "restore" as const, module: "platform", createdAt: new Date().toISOString(), result: "success" as const, validated: true },
];
const baseOperations = {
  environment: { supabase: true, stripe: true, resend: true, redis: true, cron: true, appUrl: true },
} as never;

describe("recovery center engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.backupCenter.fullPlatform).toBe(true);
    expect(doc.disasterRecovery.validation).toBe(true);
    expect(doc.security.auditProtected).toBe(true);
    expect(doc.integrations.operationsCenter).toBe(true);
  });

  it("registers backup types for backup engine", () => {
    expect(RECOVERY_BACKUP_TYPES).toContain("full");
    expect(RECOVERY_BACKUP_TYPES).toContain("database");
    expect(RECOVERY_BACKUP_TYPES).toContain("incremental");
    expect(RECOVERY_BACKUP_TYPES.length).toBeGreaterThanOrEqual(10);
  });

  it("registers rollback targets for rollback engine", () => {
    const ids = RECOVERY_ROLLBACK_TARGETS.map((target) => target.id);
    expect(ids).toContain("homepage");
    expect(ids).toContain("visual-cms");
    expect(ids).toContain("recovery");
    expect(ids.length).toBe(13);
  });

  it("builds recovery dashboard widgets", () => {
    const widgets = buildRecoveryDashboardWidgets({
      backups: baseBackups,
      history: baseHistory,
      safeMode: { enabled: false, readOnlyMarketplace: false, disablePublishing: false, disableAdminEditing: false, disableIntegrations: false, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "" },
      incidents: [],
      maintenanceEnabled: false,
      healthStatus: healthyHealth,
    });
    expect(widgets.some((widget) => widget.id === "last-backup")).toBe(true);
    expect(widgets.some((widget) => widget.id === "disaster-recovery")).toBe(true);
  });

  it("builds recovery readiness dashboard", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    const dashboard = buildRecoveryDashboard({
      config: doc,
      backups: baseBackups,
      history: baseHistory,
      safeMode: { enabled: false, readOnlyMarketplace: false, disablePublishing: false, disableAdminEditing: false, disableIntegrations: false, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "" },
      incidents: [],
      maintenanceEnabled: false,
      healthStatus: healthyHealth,
    });
    expect(dashboard.recoveryReadinessScore).toBeGreaterThan(70);
    expect(dashboard.rollbackAvailable).toBe(true);
  });

  it("builds live recovery alerts", () => {
    const alerts = buildRecoveryAlerts({
      backups: [{ ...baseBackups[0], status: "failed" }],
      safeMode: { enabled: true, readOnlyMarketplace: true, disablePublishing: true, disableAdminEditing: false, disableIntegrations: true, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "Safe mode" },
      healthStatus: "unhealthy",
      automationEnabled: false,
    });
    expect(alerts.some((alert) => alert.category === "backup")).toBe(true);
    expect(alerts.some((alert) => alert.category === "safe-mode")).toBe(true);
  });

  it("builds business continuity metrics", () => {
    const bc = buildBusinessContinuity({ backups: baseBackups, healthStatus: healthyHealth, operations: baseOperations });
    expect(bc.rtoMinutes).toBe(60);
    expect(bc.rpoMinutes).toBe(15);
    expect(bc.disasterReadiness).toBe("healthy");
  });

  it("builds live recovery monitor metrics", () => {
    const monitor = buildRecoveryMonitor({ backups: baseBackups, history: baseHistory });
    expect(monitor.some((metric) => metric.id === "success-rate")).toBe(true);
    expect(monitor.some((metric) => metric.id === "integrity-scan")).toBe(true);
  });

  it("searches recovery data across backups and rollback targets", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    const results = searchRecoveryData({
      query: "theme",
      backups: baseBackups,
      history: baseHistory,
      incidents: [],
      rollbackTargets: getRollbackTargets(doc),
    });
    expect(results.backups.some((backup) => backup.type === "theme")).toBe(true);
    expect(results.rollbackTargets.some((target) => target.id === "themes")).toBe(true);
  });

  it("enforces super admin permissions for restore and rollback", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    expect(canPerformRecoveryAction(doc, "superAdminRestore")).toBe(true);
    expect(canPerformRecoveryAction(doc, "superAdminRollback")).toBe(true);
    expect(canPerformRecoveryAction(doc, "superAdminDeleteBackups")).toBe(false);
    expect(canPerformRecoveryAction(doc, "superAdminSafeMode")).toBe(true);
  });

  it("maps recovery automation actions from config", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    const actions = getRecoveryAutomationActions(doc);
    expect(actions.length).toBe(RECOVERY_AUTOMATION_ACTIONS.length);
    expect(actions.every((action) => action.enabled)).toBe(true);
  });

  it("creates audit log entries for recovery actions", () => {
    const entry = createRecoveryCenterEngineAuditEntry({
      administrator: "admin-1",
      module: "recovery-center",
      action: "restore",
      newValue: { restoreType: "safe" },
    });
    expect(entry.administrator).toBe("admin-1");
    expect(entry.action).toBe("restore");
  });

  it("exposes API storage keys and restore types", () => {
    expect(RECOVERY_CENTER_ENGINE_LIVE_KEY).toBe("recovery_center_engine_live_v1");
    expect(RECOVERY_CENTER_BACKUPS_KEY).toBe("recovery_center_backups_v1");
    expect(RECOVERY_CENTER_SAFE_MODE_KEY).toBe("recovery_center_safe_mode_v1");
    expect(RECOVERY_RESTORE_TYPES).toContain("emergency");
    expect(countEnabledFlags(createDefaultRecoveryCenterEngineDocument().automation)).toBeGreaterThan(5);
  });

  it("validates recovery health before restore", () => {
    const valid = validateRecoveryHealth({
      backups: baseBackups,
      healthStatus: healthyHealth,
      safeMode: { enabled: false, readOnlyMarketplace: false, disablePublishing: false, disableAdminEditing: false, disableIntegrations: false, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "" },
    });
    const invalid = validateRecoveryHealth({
      backups: [],
      healthStatus: "unhealthy",
      safeMode: { enabled: false, readOnlyMarketplace: false, disablePublishing: false, disableAdminEditing: false, disableIntegrations: false, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "" },
    });
    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.issues.length).toBeGreaterThan(0);
  });

  it("reflects safe mode in dashboard score", () => {
    const doc = createDefaultRecoveryCenterEngineDocument();
    const safe = buildRecoveryDashboard({
      config: doc,
      backups: baseBackups,
      history: baseHistory,
      safeMode: { enabled: true, readOnlyMarketplace: true, disablePublishing: true, disableAdminEditing: false, disableIntegrations: true, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "Safe mode" },
      incidents: [],
      maintenanceEnabled: false,
      healthStatus: healthyHealth,
    });
    const normal = buildRecoveryDashboard({
      config: doc,
      backups: baseBackups,
      history: baseHistory,
      safeMode: { enabled: false, readOnlyMarketplace: false, disablePublishing: false, disableAdminEditing: false, disableIntegrations: false, disableScheduledJobs: false, disableAi: false, disableExternalApis: false, emergencyHomepage: false, message: "" },
      incidents: [],
      maintenanceEnabled: false,
      healthStatus: healthyHealth,
    });
    expect(safe.emergencyModeEnabled).toBe(true);
    expect(safe.recoveryReadinessScore).toBeLessThan(normal.recoveryReadinessScore);
  });
});
