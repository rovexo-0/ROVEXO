import type { OperationsEngineDocument, OperationsEngineHistoryEntry } from "@/lib/operations-center-engine/types";

const now = () => new Date().toISOString();

export function createDefaultOperationsEngineDocument(
  label = "ROVEXO Operations Center",
): OperationsEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    monitoring: {
      platformHealth: true,
      systemMonitor: true,
      liveCounters: true,
      incidentCenter: true,
      alertCenter: true,
      maintenanceCenter: true,
      liveLogs: true,
      healthChecks: true,
      automatedActions: true,
    },
    security: {
      superAdminRestart: true,
      superAdminMaintenance: true,
      superAdminRecovery: true,
      superAdminDeleteLogs: false,
      superAdminExportLogs: true,
      superAdminEmergency: true,
      auditProtected: true,
    },
    integrations: {
      missionControl: true,
      enterpriseCore: true,
      platformStudio: true,
      visualCms: true,
      themeStudioPro: true,
      developerCenter: true,
      securityCenter: true,
      recoveryCenter: true,
      globalSearch: true,
    },
    futureReady: ["Multi-region failover dashboard", "SLO burn-rate alerts"],
    auditLog: [],
  };
}

export function createDefaultOperationsEngineHistory(): OperationsEngineHistoryEntry[] {
  return [];
}

export function createDefaultMaintenanceState() {
  return {
    enabled: false,
    mode: "disabled" as const,
    message: "",
    whitelistAdmin: true,
  };
}
