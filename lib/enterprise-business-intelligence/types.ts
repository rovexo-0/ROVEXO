import type {
  AI_BI_SOURCES,
  EXPORT_FORMATS,
  FINANCIAL_METRICS,
  FORECAST_TYPES,
  KPI_PERIODS,
  MARKETPLACE_METRICS,
  REPORT_TYPES,
  TRAFFIC_SOURCES,
} from "@/lib/enterprise-business-intelligence/registry";

export type BiTab =
  | "dashboard"
  | "kpis"
  | "revenue"
  | "users"
  | "orders"
  | "sellers"
  | "products"
  | "forecasting"
  | "reports"
  | "export"
  | "settings";

export type KpiPeriod = (typeof KPI_PERIODS)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type ForecastType = (typeof FORECAST_TYPES)[number];
export type BiExportFormat = (typeof EXPORT_FORMATS)[number];
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];
export type FinancialMetric = (typeof FINANCIAL_METRICS)[number];
export type MarketplaceMetric = (typeof MARKETPLACE_METRICS)[number];
export type AiBiSource = (typeof AI_BI_SOURCES)[number];

export type KpiMetric = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  changePercent: number;
  period: KpiPeriod;
  unit: "currency" | "count" | "percent" | "score";
};

export type LeaderboardEntry = {
  id: string;
  label: string;
  value: number;
  rank: number;
  changePercent?: number;
};

export type FinancialBreakdown = {
  metric: FinancialMetric;
  label: string;
  amount: number;
  changePercent: number;
};

export type UserAnalytics = {
  registrations: number;
  retentionRate: number;
  churnRate: number;
  trustScoreAvg: number;
  businessAccounts: number;
  verifiedAccounts: number;
  topCountries: LeaderboardEntry[];
  topLanguages: LeaderboardEntry[];
  topDevices: LeaderboardEntry[];
};

export type TrafficAnalytics = {
  visitors: number;
  sessions: number;
  bounceRate: number;
  searches: number;
  searchSuccessRate: number;
  pageViews: number;
  sources: Array<{ source: TrafficSource; sessions: number; percent: number }>;
  countries: LeaderboardEntry[];
  devices: LeaderboardEntry[];
  browsers: LeaderboardEntry[];
};

export type ForecastResult = {
  id: string;
  type: ForecastType;
  source: AiBiSource;
  period: string;
  predictedValue: number;
  confidence: number;
  summary: string;
};

export type ExecutiveReport = {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  summary: string;
  metrics: string[];
};

export type BiSettings = {
  defaultPeriod: KpiPeriod;
  liveUpdatesEnabled: boolean;
  scheduledReportsEnabled: boolean;
  mfaRequired: boolean;
  autoRefreshMinutes: number;
};

export type ExecutiveDashboard = {
  revenue: number;
  profit: number;
  orders: number;
  gmv: number;
  visitors: number;
  conversionRate: number;
  activeBuyers: number;
  activeSellers: number;
  newRegistrations: number;
  pendingReviews: number;
  platformHealth: number;
  marketplaceGrowth: number;
};

export type BiState = {
  kpis: KpiMetric[];
  financial: FinancialBreakdown[];
  marketplace: Record<string, LeaderboardEntry[]>;
  userAnalytics: UserAnalytics;
  traffic: TrafficAnalytics;
  forecasts: ForecastResult[];
  reports: ExecutiveReport[];
};

export type BiSnapshot = {
  tab: BiTab;
  dashboard: ExecutiveDashboard;
  kpis: KpiMetric[];
  financial: FinancialBreakdown[];
  marketplace: Record<string, LeaderboardEntry[]>;
  userAnalytics: UserAnalytics;
  traffic: TrafficAnalytics;
  forecasts: ForecastResult[];
  reports: ExecutiveReport[];
  settings: BiSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
