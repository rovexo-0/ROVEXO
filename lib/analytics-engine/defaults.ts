import { GA_MEASUREMENT_ID } from "@/lib/analytics/ga4-config";
import {
  ANALYTICS_ENGINE_EXPORT_FORMATS,
  ANALYTICS_ENGINE_LIVE_CHARTS,
  ANALYTICS_ENGINE_LIVE_METRICS,
  ANALYTICS_ENGINE_MODULE_IDS,
  ANALYTICS_ENGINE_REPORT_PERIODS,
} from "@/lib/analytics-engine/registry";
import type { AnalyticsEngineDocument, AnalyticsEngineHistoryEntry } from "@/lib/analytics-engine/types";

const now = () => new Date().toISOString();

export function createDefaultAnalyticsEngineDocument(
  label = "ROVEXO Analytics Engine",
): AnalyticsEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    modules: ANALYTICS_ENGINE_MODULE_IDS.map((m) => ({
      ...m,
      enabled: m.id !== "auction",
    })),
    liveMetrics: ANALYTICS_ENGINE_LIVE_METRICS.map((m) => ({ ...m, enabled: true })),
    reportPeriods: ANALYTICS_ENGINE_REPORT_PERIODS.map((p) => ({ ...p, enabled: true })),
    exportFormats: ANALYTICS_ENGINE_EXPORT_FORMATS.map((f) => ({ ...f, enabled: f.id !== "api" || true })),
    liveCharts: ANALYTICS_ENGINE_LIVE_CHARTS.map((c) => ({ ...c, enabled: true })),
    googleAnalytics: {
      ga4Enabled: true,
      gtmEnabled: true,
      searchConsoleEnabled: true,
      adsConversionEnabled: false,
      measurementId: GA_MEASUREMENT_ID,
    },
    apiMonitoring: {
      apiCalls: true,
      apiErrors: true,
      latency: true,
      responseTime: true,
      rateLimits: true,
      successRate: true,
    },
    performanceMonitoring: {
      cpu: true,
      memory: true,
      storage: true,
      bandwidth: true,
      database: true,
      queueJobs: true,
      cache: true,
    },
    aiAssistant: {
      globalEnabled: false,
      trendAnalysis: true,
      revenueForecasts: true,
      businessInsights: true,
      fraudDetection: true,
      growthOpportunities: true,
      performanceRecommendations: true,
      anomalyDetection: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      shippingEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      protectionEngine: true,
      messagesEngine: true,
      notificationsEngine: true,
      listings: true,
      supportCenter: true,
      missionControl: true,
    },
    futureReady: [
      "Predictive Analytics",
      "AI Forecasting",
      "Machine Learning",
      "Heatmaps",
      "Customer Journey",
      "Sales Funnel",
      "Marketing Attribution",
      "Custom KPI Builder",
      "Scheduled Reports",
      "Data Warehouse",
    ],
    auditLog: [],
  };
}

export function createDefaultAnalyticsEngineHistory(): AnalyticsEngineHistoryEntry[] {
  return [];
}
