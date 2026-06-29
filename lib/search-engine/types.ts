export type SearchEngineModuleId =
  | "global"
  | "marketplace"
  | "listings"
  | "category"
  | "seller"
  | "business"
  | "brand"
  | "location"
  | "services"
  | "orders-admin"
  | "users-admin"
  | "enterprise";

export type SearchEngineTypeId =
  | "instant"
  | "live"
  | "autocomplete"
  | "suggestions"
  | "fuzzy"
  | "exact"
  | "keyword"
  | "advanced"
  | "voice"
  | "image"
  | "semantic";

export type SearchEngineSortId =
  | "best-match"
  | "newest"
  | "oldest"
  | "lowest-price"
  | "highest-price"
  | "nearest"
  | "most-popular"
  | "most-viewed"
  | "best-rated"
  | "trending";

export type SearchEngineIndexId =
  | "listings"
  | "category"
  | "seller"
  | "business"
  | "orders"
  | "users"
  | "messages-admin"
  | "analytics";

export type SearchEngineHealthId = "healthy" | "degraded" | "rebuilding" | "broken";

export type SearchEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type SearchEngineDashboard = {
  searchHealth: SearchEngineHealthId;
  searchScore: number;
  indexStatus: SearchEngineHealthId;
  queryTimeMs: number;
  searchSuccessRate: number;
  indexedListings: number;
  indexedCategories: number;
  indexedSellers: number;
  indexedBusinesses: number;
  searchRequests24h: number;
  failedSearches24h: number;
};

export type SearchEngineAnalytics = {
  trendingSearches: string[];
  popularCategories: string[];
  enabledSearchTypes: number;
  enabledFilters: number;
  enabledSortOptions: number;
  enabledIndexes: number;
  zeroResultRate: number;
  averageSearchTimeMs: number;
};

export type SearchEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: SearchEngineDocument;
  rollbackAvailable: boolean;
};

export type SearchEngineAuditEntry = {
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

export type SearchEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: { id: SearchEngineModuleId; label: string; enabled: boolean }[];
  searchTypes: { id: SearchEngineTypeId; label: string; enabled: boolean }[];
  filters: Record<string, boolean>;
  sortOptions: { id: SearchEngineSortId; label: string; enabled: boolean }[];
  indexes: { id: SearchEngineIndexId; label: string; enabled: boolean }[];
  performance: {
    instantResults: boolean;
    lazyLoading: boolean;
    caching: boolean;
    incrementalIndexing: boolean;
    fastRefresh: boolean;
    optimizedQueries: boolean;
  };
  apiSecurity: {
    roleBasedAccess: boolean;
    permissionValidation: boolean;
    rateLimiting: boolean;
    secureQueries: boolean;
    auditLogging: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    semanticSearch: boolean;
    querySuggestions: boolean;
    searchRanking: boolean;
    searchOptimization: boolean;
    typoCorrection: boolean;
    intentDetection: boolean;
    naturalLanguageSearch: boolean;
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
    missionControl: boolean;
  };
  futureReady: string[];
  auditLog: SearchEngineAuditEntry[];
};

export type SearchEngineSnapshot = {
  scannedAt: string;
  modules: SearchEngineModule[];
  draft: SearchEngineDocument;
  live: SearchEngineDocument;
  history: SearchEngineHistoryEntry[];
};

export type SearchEngineContext = {
  dashboard: SearchEngineDashboard;
  trendingSearches: string[];
  popularSearches: string[];
};
