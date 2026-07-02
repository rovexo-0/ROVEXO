export type AnalyticsEngineModuleId =
  | "marketplace-overview"
  | "revenue"
  | "orders"
  | "listings"
  | "shipping"
  | "wallet"
  | "payments"
  | "protection"
  | "messages"
  | "notifications"
  | "seller"
  | "buyer"
  | "business"
  | "support"
  | "search"
  | "category"
  | "auction";

export type AnalyticsEngineReportPeriodId =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type AnalyticsEngineExportFormatId = "csv" | "excel" | "pdf" | "json" | "api";

export type AnalyticsEngineLiveMetricId =
  | "marketplace-health"
  | "revenue"
  | "orders-today"
  | "orders-week"
  | "orders-month"
  | "active-users"
  | "online-users"
  | "active-sellers"
  | "new-listings"
  | "messages"
  | "notifications"
  | "support-tickets"
  | "disputes"
  | "returns"
  | "withdrawals"
  | "server-status"
  | "api-status"
  | "database-status";

export type AnalyticsEngineChartId =
  | "revenue"
  | "orders"
  | "traffic"
  | "messages"
  | "notifications"
  | "wallet"
  | "payments"
  | "protection"
  | "listings"
  | "users";

export type AnalyticsEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type AnalyticsEngineFinancialMetrics = {
  grossRevenue: number;
  netRevenue: number;
  platformFees: number;
  buyerProtectionRevenue: number;
  shippingRevenue: number;
  refunds: number;
  withdrawals: number;
  sellerEarnings: number;
  averageOrderValue: number;
  conversionRate: number;
};

export type AnalyticsEngineLiveDashboard = {
  marketplaceHealth: number;
  revenue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  activeUsers: number;
  onlineUsers: number;
  activeSellers: number;
  newListings: number;
  messages: number;
  notifications: number;
  supportTickets: number;
  disputes: number;
  returns: number;
  withdrawals: number;
};

export type AnalyticsEngineAnalytics = {
  ordersTotal: number;
  revenueTotal: number;
  messagesTotal: number;
  notificationsTotal: number;
  protectionOpenCases: number;
  walletBalance: number;
  failedPayments: number;
  averageOrderValue: number;
  conversionRate: number;
};

export type AnalyticsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: AnalyticsEngineDocument;
  rollbackAvailable: boolean;
};

export type AnalyticsEngineAuditEntry = {
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

export type AnalyticsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: { id: AnalyticsEngineModuleId; label: string; enabled: boolean }[];
  liveMetrics: { id: AnalyticsEngineLiveMetricId; label: string; enabled: boolean }[];
  reportPeriods: { id: AnalyticsEngineReportPeriodId; label: string; enabled: boolean }[];
  exportFormats: { id: AnalyticsEngineExportFormatId; label: string; enabled: boolean }[];
  liveCharts: { id: AnalyticsEngineChartId; label: string; enabled: boolean }[];
  googleAnalytics: {
    ga4Enabled: boolean;
    gtmEnabled: boolean;
    searchConsoleEnabled: boolean;
    adsConversionEnabled: boolean;
    measurementId: string;
  };
  apiMonitoring: {
    apiCalls: boolean;
    apiErrors: boolean;
    latency: boolean;
    responseTime: boolean;
    rateLimits: boolean;
    successRate: boolean;
  };
  performanceMonitoring: {
    cpu: boolean;
    memory: boolean;
    storage: boolean;
    bandwidth: boolean;
    database: boolean;
    queueJobs: boolean;
    cache: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    trendAnalysis: boolean;
    revenueForecasts: boolean;
    businessInsights: boolean;
    fraudDetection: boolean;
    growthOpportunities: boolean;
    performanceRecommendations: boolean;
    anomalyDetection: boolean;
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
    listings: boolean;
    supportCenter: boolean;
    missionControl: boolean;
  };
  futureReady: string[];
  auditLog: AnalyticsEngineAuditEntry[];
};

export type AnalyticsEngineSnapshot = {
  scannedAt: string;
  modules: AnalyticsEngineModule[];
  draft: AnalyticsEngineDocument;
  live: AnalyticsEngineDocument;
  history: AnalyticsEngineHistoryEntry[];
};

export type AnalyticsEngineContext = {
  financial: AnalyticsEngineFinancialMetrics;
  live: AnalyticsEngineLiveDashboard;
  currency: string;
  rangeLabel: string;
};
