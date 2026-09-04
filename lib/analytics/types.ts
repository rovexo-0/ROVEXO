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

export type AnalyticsRecentActivity = {
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

export type BusinessAnalyticsMetric = {
  id: string;
  label: string;
  value: number | null;
  display: string;
  format: "currency" | "number" | "percent" | "unavailable";
  deltaPercent: number | null;
  deltaLabel: string | null;
};

export type BusinessAnalyticsChartPoint = {
  date: string;
  label: string;
  value: number;
};

export type BusinessAnalyticsChart = {
  title: string;
  total: number | null;
  totalLabel: string;
  points: BusinessAnalyticsChartPoint[];
};

export type BusinessAnalyticsTopProductV1 = {
  id: string;
  title: string;
  imageUrl: string;
  qtySold: number;
  sales: number;
  href: string;
};

export type BusinessAnalyticsRecentSale = {
  id: string;
  orderId: string;
  title: string;
  imageUrl: string;
  amount: number;
  soldAt: string;
  dateLabel: string;
  href: string;
};

export type BusinessAnalyticsData = {
  period: "today" | "7d" | "30d" | "90d" | "custom";
  periodLabel: string;
  rangeStart: string;
  rangeEnd: string;
  identity: {
    businessName: string;
    avatarUrl: string | null;
  };
  isolated: boolean;
  capabilities: {
    clickThroughRate: false;
    trafficSources: false;
    searchKeywords: false;
    listingViews: boolean;
  };
  sales: {
    overview: {
      sales: BusinessAnalyticsMetric;
      orders: BusinessAnalyticsMetric;
      quantitySold: BusinessAnalyticsMetric;
      averageSale: BusinessAnalyticsMetric;
    };
    chart: BusinessAnalyticsChart;
    topProducts: BusinessAnalyticsTopProductV1[];
    recentSales: BusinessAnalyticsRecentSale[];
  };
  traffic: {
    overview: {
      listingViews: BusinessAnalyticsMetric;
      quantitySold: BusinessAnalyticsMetric;
      clickThroughRate: BusinessAnalyticsMetric;
      conversionRate: BusinessAnalyticsMetric;
    };
    chart: BusinessAnalyticsChart;
  };
};

export const ANALYTICS_DATE_RANGES: Array<{ id: AnalyticsDateRange; label: string }> = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "1y", label: "1 Year" },
];
