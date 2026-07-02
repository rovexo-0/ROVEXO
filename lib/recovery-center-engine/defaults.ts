import type {
  RecoveryBackupEntry,
  RecoveryEngineDocument,
  RecoveryEngineHistoryEntry,
  RecoveryHistoryEntry,
  RecoverySafeModeState,
} from "@/lib/recovery-center-engine/types";

const now = () => new Date().toISOString();

export function createDefaultRecoveryCenterEngineDocument(
  label = "ROVEXO Recovery Center",
): RecoveryEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    backupCenter: {
      fullPlatform: true,
      database: true,
      media: true,
      assets: true,
      theme: true,
      configuration: true,
      environment: true,
      scheduled: true,
      manual: true,
      encrypted: true,
      incremental: true,
    },
    disasterRecovery: {
      safeRecovery: true,
      emergencyRestore: true,
      partialRestore: true,
      completeRestore: true,
      validation: true,
    },
    automation: {
      automaticBackup: true,
      automaticVerification: true,
      automaticRollbackValidation: true,
      automaticRestoreValidation: true,
      automaticIntegrityScan: true,
      automaticHealthCheck: true,
      automaticAlerts: true,
    },
    security: {
      superAdminRestore: true,
      superAdminRollback: true,
      superAdminDeleteBackups: false,
      superAdminExportBackups: true,
      superAdminEmergency: true,
      superAdminSafeMode: true,
      superAdminDisasterRecovery: true,
      auditProtected: true,
    },
    integrations: {
      missionControl: true,
      enterpriseCore: true,
      operationsCenter: true,
      securityCenter: true,
      platformStudio: true,
      themeStudioPro: true,
      visualCms: true,
      developerCenter: true,
      globalSearch: true,
    },
    futureReady: ["Cross-region replication dashboard", "Immutable backup vault"],
    auditLog: [],
  };
}

export function createDefaultRecoveryCenterEngineHistory(): RecoveryEngineHistoryEntry[] {
  return [];
}

export function createDefaultBackups(): RecoveryBackupEntry[] {
  const timestamp = now();
  return [
    {
      id: "bk-full",
      label: "Full Platform Backup",
      type: "full",
      createdAt: timestamp,
      scheduled: true,
      encrypted: true,
      incremental: false,
      sizeLabel: "Supabase managed",
      status: "verified",
      rollbackAvailable: true,
    },
    {
      id: "bk-db",
      label: "Database Backup",
      type: "database",
      createdAt: timestamp,
      scheduled: true,
      encrypted: true,
      incremental: true,
      sizeLabel: "PITR enabled",
      status: "completed",
      rollbackAvailable: true,
    },
    {
      id: "bk-theme",
      label: "Theme Backup",
      type: "theme",
      createdAt: timestamp,
      scheduled: true,
      encrypted: false,
      incremental: false,
      status: "completed",
      rollbackAvailable: true,
    },
    {
      id: "bk-config",
      label: "Configuration Backup",
      type: "configuration",
      createdAt: timestamp,
      scheduled: false,
      encrypted: true,
      incremental: true,
      status: "completed",
      rollbackAvailable: true,
    },
  ];
}

export function createDefaultRecoveryHistory(): RecoveryHistoryEntry[] {
  return [
    {
      id: "rh-safe",
      label: "Safe mode checkpoint",
      type: "safe-mode",
      module: "recovery-center",
      createdAt: now(),
      result: "success",
      validated: true,
      rollbackReference: "bk-config",
    },
    {
      id: "rh-restore",
      label: "Configuration restore point",
      type: "restore",
      module: "platform-studio",
      createdAt: now(),
      result: "success",
      validated: true,
      rollbackReference: "bk-config",
    },
  ];
}

export function createDefaultSafeModeState(): RecoverySafeModeState {
  return {
    enabled: false,
    readOnlyMarketplace: false,
    disablePublishing: false,
    disableAdminEditing: false,
    disableIntegrations: false,
    disableScheduledJobs: false,
    disableAi: false,
    disableExternalApis: false,
    emergencyHomepage: false,
    message: "",
  };
}
