import type {
  EnterpriseCoreBackupEntry,
  EnterpriseCoreDocument,
  EnterpriseCoreHistoryEntry,
  EnterpriseCoreNotification,
  EnterpriseCoreRecoveryEntry,
  EnterpriseCoreRole,
  EnterpriseCoreUpdateEntry,
  EnterpriseCoreAiAssistant,
} from "@/lib/enterprise-core/types";

const now = () => new Date().toISOString();

export function createDefaultEnterpriseCoreDocument(label = "ROVEXO Enterprise Core"): EnterpriseCoreDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    notifications: createDefaultNotifications(),
    backups: createDefaultBackups(),
    roles: createDefaultRoles(),
    updates: createDefaultUpdates(),
    recoveryHistory: createDefaultRecoveryHistory(),
    aiAssistant: createDefaultAiAssistant(),
    auditLog: [],
  };
}

export function createDefaultEnterpriseCoreHistory(): EnterpriseCoreHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): EnterpriseCoreNotification[] {
  return [
    { id: "n-1", title: "Enterprise Core online", message: "Unified operating system initialized", severity: "success", module: "enterprise-core", timestamp: now(), acknowledged: true },
    { id: "n-2", title: "Push notifications", message: "Configure web push keys for full delivery", severity: "warning", module: "notifications", timestamp: now(), acknowledged: false, group: "system" },
    { id: "n-3", title: "Platform healthy", message: "All core services operational", severity: "info", module: "operations", timestamp: now(), acknowledged: true, group: "health" },
  ];
}

function createDefaultBackups(): EnterpriseCoreBackupEntry[] {
  return [
    { id: "b-full", label: "Full platform backup", type: "full", createdAt: now(), scheduled: true, rollbackAvailable: true },
    { id: "b-config", label: "Configuration snapshot", type: "configuration", createdAt: now(), scheduled: false, rollbackAvailable: true },
    { id: "b-theme", label: "Theme backup", type: "theme", createdAt: now(), scheduled: true, rollbackAvailable: true },
    { id: "b-settings", label: "Settings backup", type: "settings", createdAt: now(), scheduled: true, rollbackAvailable: true },
  ];
}

function createDefaultRoles(): EnterpriseCoreRole[] {
  return [
    {
      id: "super-admin",
      name: "Super Admin",
      template: "full-access",
      permissions: ["read", "write", "publish", "delete", "approve", "recovery"],
      moduleAccess: ["*"],
      apiAccess: ["*"],
      publishRights: true,
      approvalRights: true,
      recoveryRights: true,
      status: "published",
    },
    {
      id: "support-lead",
      name: "Support Lead",
      template: "support",
      permissions: ["read", "moderate"],
      moduleAccess: ["support-center", "messages"],
      apiAccess: ["read"],
      publishRights: false,
      approvalRights: false,
      recoveryRights: false,
      status: "published",
    },
    {
      id: "analytics-viewer",
      name: "Analytics Viewer",
      template: "read-only",
      permissions: ["read"],
      moduleAccess: ["analytics-center"],
      apiAccess: ["read"],
      publishRights: false,
      approvalRights: false,
      recoveryRights: false,
      status: "draft",
    },
  ];
}

function createDefaultUpdates(): EnterpriseCoreUpdateEntry[] {
  return [
    { id: "u-mc", name: "Mission Control", type: "module", version: "1.0", previousVersion: "0.9", compatible: true, rollbackAvailable: true, updatedAt: now() },
    { id: "u-ts", name: "Theme Studio Pro", type: "theme", version: "1.0", compatible: true, rollbackAvailable: true, updatedAt: now() },
    { id: "u-ec", name: "Enterprise Core", type: "platform", version: "1.0", compatible: true, rollbackAvailable: false, updatedAt: now() },
  ];
}

function createDefaultRecoveryHistory(): EnterpriseCoreRecoveryEntry[] {
  return [
    { id: "r-safe", label: "Safe mode checkpoint", type: "safe-mode", createdAt: now(), validated: true, rollbackAvailable: true },
    { id: "r-restore", label: "Configuration restore point", type: "restore", createdAt: now(), validated: true, rollbackAvailable: true },
  ];
}

function createDefaultAiAssistant(): EnterpriseCoreAiAssistant {
  return {
    globalEnabled: false,
    execution: "local",
    capabilities: [
      { id: "platform-analysis", label: "Platform Analysis", enabled: true, execution: "local" },
      { id: "health-reports", label: "Health Reports", enabled: true, execution: "local" },
      { id: "config-review", label: "Configuration Review", enabled: true, execution: "hybrid" },
      { id: "asset-suggestions", label: "Asset Suggestions", enabled: false, execution: "local" },
      { id: "theme-suggestions", label: "Theme Suggestions", enabled: false, execution: "local" },
      { id: "performance-suggestions", label: "Performance Suggestions", enabled: true, execution: "local" },
      { id: "developer-assistance", label: "Developer Assistance", enabled: true, execution: "hybrid" },
      { id: "error-detection", label: "Error Detection", enabled: true, execution: "local" },
      { id: "future-planning", label: "Future Planning", enabled: false, execution: "cloud" },
    ],
  };
}
