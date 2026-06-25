import type { LiveCountry } from "@/lib/analytics/live-countries/types";

export type LiveCountryRow = LiveCountry & {
  percentage: number;
  state?: "entering" | "visible" | "leaving";
};

export type LiveDimensionRow = {
  id: string;
  label: string;
  activeUsers: number;
  percentage: number;
};

export type LiveCityRow = {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  flag: string;
  activeUsers: number;
  percentage: number;
};

export type LiveEventType =
  | "visitor_joined"
  | "seller_registered"
  | "listing_published"
  | "order_created"
  | "payment_completed"
  | "refund_created"
  | "user_signed_in"
  | "user_signed_out";

export type LiveEventItem = {
  id: string;
  type: LiveEventType;
  title: string;
  subtitle?: string;
  countryCode?: string;
  countryName?: string;
  flag?: string;
  browser?: string;
  operatingSystem?: string;
  timestamp: string;
};

export type LiveVisitorMetrics = {
  currentVisitors: number;
  returningVisitors: number;
  newVisitors: number;
  averageSessionDurationSeconds: number;
  bounceRate: number;
  pagesPerSession: number;
};

export type LivePerformanceMetrics = {
  cpuUsagePercent: number;
  ramUsagePercent: number;
  apiResponseTimeMs: number;
  databaseConnections: number;
  cacheHitRatio: number;
  queueStatus: string;
};

export type LiveAnalyticsSource = "ga4" | "platform" | "hybrid";

export type LiveAnalyticsSnapshot = {
  countries: LiveCountryRow[];
  devices: LiveDimensionRow[];
  browsers: LiveDimensionRow[];
  operatingSystems: LiveDimensionRow[];
  trafficSources: LiveDimensionRow[];
  cities: LiveCityRow[];
  events: LiveEventItem[];
  visitorMetrics: LiveVisitorMetrics;
  performance: LivePerformanceMetrics;
  source: LiveAnalyticsSource;
  updatedAt: string;
};

export type LiveAnalyticsFilters = {
  query: string;
  country: string;
  browser: string;
  operatingSystem: string;
  device: string;
  trafficSource: string;
  date: string;
  liveOnly: boolean;
};

export const DEFAULT_LIVE_ANALYTICS_FILTERS: LiveAnalyticsFilters = {
  query: "",
  country: "",
  browser: "",
  operatingSystem: "",
  device: "",
  trafficSource: "",
  date: "",
  liveOnly: true,
};
