export type AppStudioPublishStatus = "draft" | "published" | "archived";

export type AppStudioModuleHealth = "healthy" | "warning" | "critical" | "offline";

export type AppStudioModuleStatus = "live" | "beta" | "coming-soon" | "maintenance" | "experimental" | "deprecated" | "archived";

export type AppStudioNotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "high"
  | "critical"
  | "emergency";

export type AppStudioAiExecution = "local" | "cloud" | "hybrid" | "server";

export type AppStudioFeatureState =
  | "live"
  | "beta"
  | "coming-soon"
  | "maintenance"
  | "experimental"
  | "deprecated"
  | "archived";

export type AppStudioPlatformModule = {
  id: string;
  label: string;
  icon: string;
  category: "marketplace" | "commerce" | "people" | "platform" | "insights" | "design" | "settings";
  href?: string;
  status: AppStudioModuleStatus;
  version: string;
  health: AppStudioModuleHealth;
  performanceScore: number;
  permissions: string[];
  dependencies: string[];
};

export type AppStudioCustomModule = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  route?: string;
  permissions: string[];
  visibility: "public" | "admin" | "hidden";
  status: AppStudioModuleStatus;
  version: number;
  navigation: boolean;
  analytics: boolean;
  notifications: boolean;
  aiIntegration: boolean;
  featureFlags: string[];
  updatedAt: string;
};

export type AppStudioPage = {
  id: string;
  name: string;
  pageType: string;
  route?: string;
  status: AppStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type AppStudioNavSection = {
  id: string;
  label: string;
  items: {
    id: string;
    label: string;
    href: string;
    icon?: string;
    badge?: string;
    permissions?: string[];
    visible: boolean;
    children?: AppStudioNavSection["items"];
  }[];
};

export type AppStudioNavigationConfig = {
  topNav: AppStudioNavSection;
  bottomNav: AppStudioNavSection;
  sidebar: AppStudioNavSection;
  footerNav: AppStudioNavSection;
  accountNav: AppStudioNavSection;
  businessNav: AppStudioNavSection;
  sellerNav: AppStudioNavSection;
  buyerNav: AppStudioNavSection;
  supportNav: AppStudioNavSection;
  mobileNav: AppStudioNavSection;
  desktopNav: AppStudioNavSection;
};

export type AppStudioAutomation = {
  id: string;
  name: string;
  moduleId: string;
  trigger: { type: string; label: string };
  conditions: { id: string; expression: string }[];
  actions: { id: string; type: string; label: string }[];
  schedule?: string;
  aiEnabled: boolean;
  status: AppStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type AppStudioSecurityRole = {
  id: string;
  name: string;
  permissions: string[];
  twoFactorRequired: boolean;
  status: AppStudioPublishStatus;
};

export type AppStudioSecurityConfig = {
  globalTwoFactor: boolean;
  emergencyLockdown: boolean;
  suspiciousActivityDetection: boolean;
  apiKeysEnabled: boolean;
  roles: AppStudioSecurityRole[];
};

export type AppStudioPlugin = {
  id: string;
  name: string;
  type: "official" | "custom";
  version: string;
  dependencies: string[];
  compatibility: string;
  enabled: boolean;
  status: AppStudioPublishStatus;
  updatedAt: string;
};

export type AppStudioAnalyticsMetric = {
  id: string;
  label: string;
  value: number | string;
  delta?: number;
  href?: string;
};

export type AppStudioRecoveryPoint = {
  id: string;
  label: string;
  type: "configuration" | "theme" | "assets" | "full";
  createdAt: string;
  rollbackAvailable: boolean;
};

export type AppStudioNotificationAlert = {
  id: string;
  title: string;
  message: string;
  severity: AppStudioNotificationSeverity;
  module: string;
  timestamp: string;
  acknowledged: boolean;
};

export type AppStudioSystemHealthMetric = {
  id: string;
  label: string;
  status: AppStudioModuleHealth;
  value?: string;
  detail?: string;
};

export type AppStudioAuditEntry = {
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

export type AppStudioHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: AppStudioDocument;
  rollbackAvailable: boolean;
};

export type AppStudioDocument = {
  version: number;
  updatedAt: string;
  label: string;
  customModules: AppStudioCustomModule[];
  pages: AppStudioPage[];
  navigation: AppStudioNavigationConfig;
  automations: AppStudioAutomation[];
  security: AppStudioSecurityConfig;
  plugins: AppStudioPlugin[];
  recoveryPoints: AppStudioRecoveryPoint[];
  notificationAlerts: AppStudioNotificationAlert[];
  auditLog: AppStudioAuditEntry[];
};

export type AppStudioIntegrations = {
  features: {
    id: string;
    label: string;
    description?: string;
    enabled: boolean;
    state: AppStudioFeatureState;
    version?: string;
  }[];
  ai: {
    globalEnabled: boolean;
    features: {
      id: string;
      label: string;
      description?: string;
      enabled: boolean;
      execution: AppStudioAiExecution;
    }[];
  };
};

export type AppStudioSnapshot = {
  scannedAt: string;
  modules: AppStudioPlatformModule[];
  draft: AppStudioDocument;
  live: AppStudioDocument;
  history: AppStudioHistoryEntry[];
  integrations: AppStudioIntegrations;
  systemHealth: AppStudioSystemHealthMetric[];
  analytics: AppStudioAnalyticsMetric[];
};
