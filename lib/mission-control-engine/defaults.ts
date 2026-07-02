import {
  MISSION_CONTROL_ENGINE_SECTION_IDS,
  MISSION_CONTROL_QUICK_ACTIONS,
} from "@/lib/mission-control-engine/registry";
import type { MissionControlEngineDocument, MissionControlEngineHistoryEntry, MissionControlEngineSectionId } from "@/lib/mission-control-engine/types";

const now = () => new Date().toISOString();

export function createDefaultMissionControlEngineDocument(
  label = "ROVEXO Mission Control v2",
): MissionControlEngineDocument {
  return {
    version: 2,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    sections: MISSION_CONTROL_ENGINE_SECTION_IDS.map((s) => ({
      id: s.id as MissionControlEngineSectionId,
      label: s.label,
      enabled: true,
    })),
    quickActions: MISSION_CONTROL_QUICK_ACTIONS.map((a) => ({ id: a.id, label: a.label, enabled: true })),
    widgets: {
      homepageStatus: true,
      marketplaceStatus: true,
      usersOnline: true,
      orders: true,
      sales: true,
      payments: true,
      wallet: true,
      protection: true,
      search: true,
      ai: true,
      infrastructure: true,
      database: true,
      storage: true,
      api: true,
      cronJobs: true,
      queues: true,
      notifications: true,
      messages: true,
      security: true,
      backups: true,
      recovery: true,
      analytics: true,
    },
    productivity: {
      undoRedo: true,
      history: true,
      rollback: true,
      snapshots: true,
      autoSave: true,
      manualSave: true,
      draftPreview: true,
      publishLive: true,
    },
    monitoring: {
      cpu: true,
      ram: true,
      disk: true,
      bandwidth: true,
      database: true,
      redis: true,
      storage: true,
      cdn: true,
      api: true,
      queue: true,
      workers: true,
      cron: true,
    },
    security: {
      superAdminOnly: true,
      permissionBased: true,
      auditProtected: true,
      immutableLogs: true,
      enterpriseAuth: true,
    },
    integrations: {
      enterpriseCore: true,
      platformStudio: true,
      themeStudio: true,
      appStudio: true,
      developerCenter: true,
      analyticsEngine: true,
      securityEngine: true,
      aiEngine: true,
      integrationsEngine: true,
      searchEngine: true,
    },
    futureReady: ["Multi-region failover", "Live deployment pipeline", "Command palette v3"],
    auditLog: [],
  };
}

export function createDefaultMissionControlEngineHistory(): MissionControlEngineHistoryEntry[] {
  return [];
}
