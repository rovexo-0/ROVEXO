export type AiEngineModuleId =
  | "control-center"
  | "marketplace-assistant"
  | "buyer-assistant"
  | "seller-assistant"
  | "business-assistant"
  | "super-admin-assistant"
  | "developer-assistant"
  | "customer-support"
  | "automation-center"
  | "prompt-library"
  | "provider-manager"
  | "monitoring-center";

export type AiEngineProviderId =
  | "local"
  | "cloud"
  | "openai"
  | "anthropic"
  | "google"
  | "microsoft"
  | "ollama"
  | "lm-studio"
  | "custom";

export type AiEngineRoleId =
  | "buyer"
  | "seller"
  | "business"
  | "support"
  | "moderator"
  | "administrator"
  | "super-administrator"
  | "developer";

export type AiEngineExecutionId = "local" | "edge" | "cloud" | "hybrid";

export type AiEngineHealthId = "healthy" | "degraded" | "offline" | "disabled";

export type AiEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type AiEngineDashboard = {
  aiHealth: AiEngineHealthId;
  aiScore: number;
  globalEnabled: boolean;
  enabledModules: number;
  enabledProviders: number;
  requests24h: number;
  errors24h: number;
  averageLatencyMs: number;
  localModelStatus: "ready" | "unavailable" | "disabled";
  cloudStatus: "configured" | "unconfigured" | "disabled";
};

export type AiEngineAnalytics = {
  enabledMarketplaceAi: number;
  enabledImageAi: number;
  enabledLanguageAi: number;
  enabledAutomation: number;
  providerCount: number;
  permissionRoles: number;
  auditEvents: number;
  tokenEstimate24h: number;
};

export type AiEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: AiEngineDocument;
  rollbackAvailable: boolean;
};

export type AiEngineAuditEntry = {
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

export type AiEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  globalEnabled: boolean;
  modules: { id: AiEngineModuleId; label: string; enabled: boolean }[];
  marketplaceAi: Record<string, boolean>;
  imageAi: Record<string, boolean>;
  languageAi: Record<string, boolean>;
  buyerAi: Record<string, boolean>;
  sellerAi: Record<string, boolean>;
  businessAi: Record<string, boolean>;
  supportAi: Record<string, boolean>;
  moderationAi: Record<string, boolean>;
  analyticsAi: Record<string, boolean>;
  automation: Record<string, boolean>;
  providers: { id: AiEngineProviderId; label: string; enabled: boolean; execution: AiEngineExecutionId }[];
  permissions: { id: AiEngineRoleId; label: string; enabled: boolean }[];
  performance: {
    lazyLoading: boolean;
    streamingResponses: boolean;
    caching: boolean;
    queueProcessing: boolean;
    backgroundTasks: boolean;
    optimizedExecution: boolean;
  };
  security: {
    encryptedPrompts: boolean;
    secureApiKeys: boolean;
    permissionValidation: boolean;
    providerIsolation: boolean;
    auditLogging: boolean;
    rateLimiting: boolean;
  };
  executionPolicy: {
    defaultDisabled: boolean;
    priorityLocal: boolean;
    priorityEdge: boolean;
    cloudWhenRequired: boolean;
    autoFallback: boolean;
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
    missionControl: boolean;
  };
  futureReady: string[];
  auditLog: AiEngineAuditEntry[];
};

export type AiEngineSnapshot = {
  scannedAt: string;
  modules: AiEngineModule[];
  draft: AiEngineDocument;
  live: AiEngineDocument;
  history: AiEngineHistoryEntry[];
};

export type AiEngineContext = {
  dashboard: AiEngineDashboard;
  role: string;
  missionControlEnabled: boolean;
  visionConfigured: boolean;
};
