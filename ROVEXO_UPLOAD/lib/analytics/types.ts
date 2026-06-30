import type { DashboardPerformance } from "@/features/dashboard/types";

export type AnalyticsDateRange = "7d" | "30d" | "90d" | "1y";

export type AnalyticsOverviewMetric = {
  label: string;
  value: number;
  format?: "currency" | "number" | "percent";
};

export type AnalyticsSegment = {
  id: string;
  label: string;
  value: number;
};

export type AnalyticsTopProduct = {
  id: string;
  title: string;
  imageUrl: string;
  revenue: number;
  orders: number;
};

export type AnalyticsGeographicCountry = {
  id: string;
  name: string;
  code: string;
  revenue: number;
  orders: number;
  mapX: number;
  mapY: number;
};

export type AnalyticsRecentActivity = {
  followers: number;
  reviews: number;
  saves: number;
};

export type SellerAnalyticsData = {
  range: AnalyticsDateRange;
  rangeLabel: string;
  overview: AnalyticsOverviewMetric[];
  performance: DashboardPerformance;
  topProducts: AnalyticsTopProduct[];
  trafficSources: AnalyticsSegment[];
  recentActivity: AnalyticsRecentActivity;
  promotions?: PromotionAnalyticsSummary;
};

export type PromotionAnalyticsSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  purchases: number;
  revenueCents: number;
};

export type BusinessAnalyticsData = {
  range: AnalyticsDateRange;
  rangeLabel: string;
  overview: AnalyticsOverviewMetric[];
  performance: DashboardPerformance;
  salesChannels: AnalyticsSegment[];
  topProducts: AnalyticsTopProduct[];
  geographicSales: AnalyticsGeographicCountry[];
};

export const ANALYTICS_DATE_RANGES: Array<{ id: AnalyticsDateRange; label: string }> = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "1y", label: "1 Year" },
];
