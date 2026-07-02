export type EnterpriseCoreHealth = "healthy" | "warning" | "critical" | "offline";

export type EnterpriseCoreSeverity =
  | "info"
  | "success"
  | "warning"
  | "high"
  | "critical"
  | "emergency";

export type EnterpriseCorePublishStatus = "draft" | "published" | "archived";

export type EnterpriseCoreRegistryModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  category: "core" | "commerce" | "platform" | "insights" | "operations";
  version: string;
  health: EnterpriseCoreHealth;
  autoRegister: boolean;
};

export type EnterpriseCoreSearchCategory =
  | "users"
  | "businesses"
  | "listings"
  | "orders"
  | "protection"
  | "payments"
  | "wallet"
  | "shipping"
  | "reviews"
  | "messages"
  | "support"
  | "categories"
  | "homepage"
  | "assets"
  | "themes"
  | "components"
  | "forms"
  | "workflows"
  | "notifications"
  | "analytics"
  | "reports"
  | "audit"
  | "developer"
  | "settings"
  | "ai"
  | "features"
  | "permissions";

export type EnterpriseCoreSearchResult = {
  id: string;
  category: EnterpriseCoreSearchCategory;
  title: string;
  subtitle: string;
  href: string;
};

export type EnterpriseCoreSettingGroup = {
  id: string;
  label: string;
  href: string;
  settingKeys: string[];
  module: string;
};

export type EnterpriseCoreDashboardMetric = {
  id: string;
  label: string;
  value: number | string;
  delta?: number;
  href?: string;
};

export type EnterpriseCoreNotification = {
  id: string;
  title: string;
  message: string;
  severity: EnterpriseCoreSeverity;
  module: string;
  timestamp: string;
  acknowledged: boolean;
  group?: string;
};

export type EnterpriseCoreAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  device?: string;
  rollbackAvailable: boolean;
};

export type EnterpriseCoreBackupEntry = {
  id: string;
  label: string;
  type: "full" | "partial" | "configuration" | "theme" | "assets" | "workflow" | "settings" | "database";
  createdAt: string;
  scheduled: boolean;
  rollbackAvailable: boolean;
};

export type EnterpriseCoreRole = {
  id: string;
  name: string;
  template?: string;
  permissions: string[];
  moduleAccess: string[];
  apiAccess: string[];
  publishRights: boolean;
  approvalRights: boolean;
  recoveryRights: boolean;
  status: EnterpriseCorePublishStatus;
};

export type EnterpriseCoreUpdateEntry = {
  id: string;
  name: string;
  type: "platform" | "module" | "theme" | "asset" | "plugin";
  version: string;
  previousVersion?: string;
  compatible: boolean;
  rollbackAvailable: boolean;
  updatedAt: string;
};

export type EnterpriseCoreHealthScore = {
  id: string;
  label: string;
  score: number;
  status: EnterpriseCoreHealth;
};

export type EnterpriseCoreAnalyticsMetric = {
  id: string;
  label: string;
  value: number | string;
  delta?: number;
  growth?: number;
};

export type EnterpriseCoreAiAssistant = {
  globalEnabled: boolean;
  execution: "local" | "cloud" | "hybrid";
  capabilities: {
    id: string;
    label: string;
    enabled: boolean;
    execution: "local" | "cloud" | "hybrid";
  }[];
};

export type EnterpriseCoreOperationsMetric = {
  id: string;
  label: string;
  status: EnterpriseCoreHealth;
  value?: string;
  detail?: string;
};

export type EnterpriseCoreDeveloperTool = {
  id: string;
  label: string;
  href: string;
  status: EnterpriseCoreHealth;
  description?: string;
};

export type EnterpriseCoreRecoveryEntry = {
  id: string;
  label: string;
  type: "emergency" | "safe-mode" | "rollback" | "restore" | "disaster";
  createdAt: string;
  validated: boolean;
  rollbackAvailable: boolean;
};

export type EnterpriseCoreHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: EnterpriseCoreDocument;
  rollbackAvailable: boolean;
};

export type EnterpriseCoreDocument = {
  version: number;
  updatedAt: string;
  label: string;
  notifications: EnterpriseCoreNotification[];
  backups: EnterpriseCoreBackupEntry[];
  roles: EnterpriseCoreRole[];
  updates: EnterpriseCoreUpdateEntry[];
  recoveryHistory: EnterpriseCoreRecoveryEntry[];
  aiAssistant: EnterpriseCoreAiAssistant;
  auditLog: EnterpriseCoreAuditEntry[];
};

export type EnterpriseCoreSnapshot = {
  scannedAt: string;
  registry: EnterpriseCoreRegistryModule[];
  draft: EnterpriseCoreDocument;
  live: EnterpriseCoreDocument;
  history: EnterpriseCoreHistoryEntry[];
  dashboard: EnterpriseCoreDashboardMetric[];
  settingsGroups: EnterpriseCoreSettingGroup[];
  healthScores: EnterpriseCoreHealthScore[];
  analytics: EnterpriseCoreAnalyticsMetric[];
  operations: EnterpriseCoreOperationsMetric[];
  developerTools: EnterpriseCoreDeveloperTool[];
  platformHealth: EnterpriseCoreHealth;
  overallScore: number;
};
