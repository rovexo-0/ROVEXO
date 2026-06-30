export type IntegrationsEngineModuleId =
  | "integration-center"
  | "api-manager"
  | "oauth-manager"
  | "webhook-manager"
  | "provider-manager"
  | "secrets-manager"
  | "health-monitor"
  | "integration-analytics"
  | "integration-logs"
  | "testing-center";

export type IntegrationsEngineHealthId = "healthy" | "degraded" | "offline" | "disabled";

export type IntegrationsEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type IntegrationsEngineProviderStatus = {
  id: string;
  label: string;
  category: string;
  configured: boolean;
  enabled: boolean;
  status: IntegrationsEngineHealthId;
  latencyMs?: number;
};

export type IntegrationsEngineDashboard = {
  integrationHealth: IntegrationsEngineHealthId;
  integrationScore: number;
  enabledProviders: number;
  configuredProviders: number;
  healthyProviders: number;
  webhookEndpoints: number;
  apiHealth: number;
  successRate: number;
  averageLatencyMs: number;
  errors24h: number;
};

export type IntegrationsEngineAnalytics = {
  paymentProviders: number;
  shippingProviders: number;
  communicationProviders: number;
  cloudProviders: number;
  enabledModules: number;
  webhookFeatures: number;
  secretsFeatures: number;
  auditEvents: number;
};

export type IntegrationsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: IntegrationsEngineDocument;
  rollbackAvailable: boolean;
};

export type IntegrationsEngineAuditEntry = {
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

export type IntegrationsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: { id: IntegrationsEngineModuleId; label: string; enabled: boolean }[];
  paymentProviders: Record<string, boolean>;
  shippingProviders: Record<string, boolean>;
  mapsLocation: Record<string, boolean>;
  googleServices: Record<string, boolean>;
  appleServices: Record<string, boolean>;
  microsoftServices: Record<string, boolean>;
  emailServices: Record<string, boolean>;
  smsServices: Record<string, boolean>;
  pushNotifications: Record<string, boolean>;
  fileStorage: Record<string, boolean>;
  apiManagement: Record<string, boolean>;
  webhooks: Record<string, boolean>;
  secretsManagement: Record<string, boolean>;
  performance: {
    lazyLoading: boolean;
    backgroundQueue: boolean;
    retryLogic: boolean;
    caching: boolean;
    connectionPooling: boolean;
    optimizedRequests: boolean;
  };
  security: {
    encryptedSecrets: boolean;
    permissionValidation: boolean;
    secureWebhooks: boolean;
    rateLimiting: boolean;
    auditLogging: boolean;
    roleBasedAccess: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    providerRecommendations: boolean;
    healthAnalysis: boolean;
    failureDetection: boolean;
    performanceInsights: boolean;
    automaticDiagnostics: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    ordersEngine: boolean;
    shippingEngine: boolean;
    walletEngine: boolean;
    paymentsEngine: boolean;
    protectionEngine: boolean;
    messagesEngine: boolean;
    notificationsEngine: boolean;
    analyticsEngine: boolean;
    securityEngine: boolean;
    searchEngine: boolean;
    aiEngine: boolean;
    missionControl: boolean;
  };
  futureReady: string[];
  auditLog: IntegrationsEngineAuditEntry[];
};

export type IntegrationsEngineSnapshot = {
  scannedAt: string;
  modules: IntegrationsEngineModule[];
  draft: IntegrationsEngineDocument;
  live: IntegrationsEngineDocument;
  history: IntegrationsEngineHistoryEntry[];
};

export type IntegrationsEngineContext = {
  dashboard: IntegrationsEngineDashboard;
  providers: IntegrationsEngineProviderStatus[];
  role: string;
};
