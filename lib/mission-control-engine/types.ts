export type MissionControlEngineSectionId =
  | "dashboard"
  | "homepage-builder"
  | "theme-studio"
  | "platform-studio"
  | "menu-builder"
  | "header-builder"
  | "footer-builder"
  | "bottom-nav-builder"
  | "category-builder"
  | "banner-builder"
  | "search-builder"
  | "listing-builder"
  | "asset-library"
  | "ai-center"
  | "analytics-center"
  | "orders-center"
  | "shipping-center"
  | "wallet-center"
  | "payments-center"
  | "protection-center"
  | "messages-center"
  | "notifications-center"
  | "security-center"
  | "search-engine-center"
  | "integrations-center"
  | "infrastructure-center"
  | "disaster-recovery-center"
  | "recovery-center"
  | "developer-center"
  | "system-settings";

export type MissionControlBadgeLevel = "healthy" | "info" | "warning" | "attention" | "critical";

export type MissionControlEngineSection = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  group: "visual" | "commerce" | "enterprise" | "operations";
  badge?: number;
  badgeLevel?: MissionControlBadgeLevel;
};

export type MissionControlQuickAction = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

export type MissionControlLiveWidget = {
  id: string;
  label: string;
  value: string | number;
  delta?: number;
  href?: string;
  level: MissionControlBadgeLevel;
};

export type MissionControlStatusBar = {
  platformStatus: "online" | "warning" | "offline";
  environment: string;
  version: string;
  build: string;
  gitRevision: string;
  lastDeployment: string;
  database: MissionControlBadgeLevel;
  infrastructure: MissionControlBadgeLevel;
  ai: MissionControlBadgeLevel;
  search: MissionControlBadgeLevel;
  payments: MissionControlBadgeLevel;
};

export type MissionControlMonitoring = {
  healthScore: number;
  uptime: string;
  errorRate: number;
  latencyMs: number;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  apiLatencyMs: number;
  requestsPerMinute: number;
};

export type MissionControlNotificationPreview = {
  id: string;
  title: string;
  module: string;
  priority: "information" | "warning" | "critical" | "resolved";
  createdAt: string;
};

export type MissionControlEngineDashboard = {
  commandScore: number;
  modulesEnabled: number;
  widgetsLive: number;
  auditEvents24h: number;
  quickActions: number;
};

export type MissionControlEngineAnalytics = {
  visualSections: number;
  commerceSections: number;
  enterpriseSections: number;
  operationsSections: number;
  monitoringEnabled: number;
  productivityEnabled: number;
};

export type MissionControlEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: MissionControlEngineDocument;
  rollbackAvailable: boolean;
};

export type MissionControlEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type MissionControlEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  sections: { id: MissionControlEngineSectionId; label: string; enabled: boolean }[];
  quickActions: { id: string; label: string; enabled: boolean }[];
  widgets: Record<string, boolean>;
  productivity: {
    undoRedo: boolean;
    history: boolean;
    rollback: boolean;
    snapshots: boolean;
    autoSave: boolean;
    manualSave: boolean;
    draftPreview: boolean;
    publishLive: boolean;
  };
  monitoring: {
    cpu: boolean;
    ram: boolean;
    disk: boolean;
    bandwidth: boolean;
    database: boolean;
    redis: boolean;
    storage: boolean;
    cdn: boolean;
    api: boolean;
    queue: boolean;
    workers: boolean;
    cron: boolean;
  };
  security: {
    superAdminOnly: boolean;
    permissionBased: boolean;
    auditProtected: boolean;
    immutableLogs: boolean;
    enterpriseAuth: boolean;
  };
  integrations: Record<string, boolean>;
  futureReady: string[];
  auditLog: MissionControlEngineAuditEntry[];
};

export type MissionControlEngineSnapshot = {
  scannedAt: string;
  sections: MissionControlEngineSection[];
  draft: MissionControlEngineDocument;
  live: MissionControlEngineDocument;
  history: MissionControlEngineHistoryEntry[];
};

export type MissionControlV2Context = {
  dashboard: MissionControlEngineDashboard;
  statusBar: MissionControlStatusBar;
  widgets: MissionControlLiveWidget[];
  monitoring: MissionControlMonitoring;
  notifications: MissionControlNotificationPreview[];
  scannedAt: string;
};
