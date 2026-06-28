import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import {
  allAiSourcesPresent,
  generateBiAiInsights,
  omegaForecastCount,
  scanPatternCount,
  sentinelRiskCount,
} from "@/lib/enterprise-business-intelligence/ai-integration";
import { canPerformBiAction, createBiAuditEntry, requiresMfaForBi } from "@/lib/enterprise-business-intelligence/audit";
import { isBiConfigAction } from "@/lib/enterprise-business-intelligence/config-actions";
import { complianceScore, listComplianceFrameworks } from "@/lib/enterprise-business-intelligence/compliance";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { buildExecutiveDashboard, createDefaultBiSettings, createDefaultBiState, refreshBiMetrics } from "@/lib/enterprise-business-intelligence/engine";
import { exportBiSnapshot, isValidBiExportFormat, parseBiImportPayload } from "@/lib/enterprise-business-intelligence/export";
import { createDefaultFinancialBreakdown, netProfit, totalRevenue, isValidFinancialMetric } from "@/lib/enterprise-business-intelligence/financial";
import {
  averageForecastConfidence,
  coversAllForecastTypes,
  generateForecasts,
  isValidForecastType,
  runForecast,
} from "@/lib/enterprise-business-intelligence/forecasting";
import { computeBiHealth } from "@/lib/enterprise-business-intelligence/health";
import {
  aggregateKpiScore,
  createDefaultKpis,
  createKpi,
  isValidKpiPeriod,
  kpiTrendPositive,
  recalculateKpis,
} from "@/lib/enterprise-business-intelligence/kpis";
import { createDefaultMarketplaceAnalytics, topByValue } from "@/lib/enterprise-business-intelligence/marketplace";
import { validateBiReadiness } from "@/lib/enterprise-business-intelligence/reader";
import { ENTERPRISE_BI_API, ENTERPRISE_BI_ROUTES, FORECAST_TYPES, KPI_PERIODS, REPORT_TYPES } from "@/lib/enterprise-business-intelligence/registry";
import { createDefaultReports, generateReport, isValidReportType, formatReportMarkdown } from "@/lib/enterprise-business-intelligence/reports";
import type { BiSnapshot } from "@/lib/enterprise-business-intelligence/types";
import { conversionFromTraffic, createDefaultTrafficAnalytics } from "@/lib/enterprise-business-intelligence/traffic";
import { createDefaultUserAnalytics, verifiedRate } from "@/lib/enterprise-business-intelligence/users";

function sampleSnapshot(overrides: Partial<BiSnapshot> = {}): BiSnapshot {
  const state = createDefaultBiState();
  const settings = createDefaultBiSettings();
  return {
    tab: "dashboard",
    dashboard: buildExecutiveDashboard(state, settings),
    kpis: state.kpis,
    financial: state.financial,
    marketplace: state.marketplace,
    userAnalytics: state.userAnalytics,
    traffic: state.traffic,
    forecasts: state.forecasts,
    reports: state.reports,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: { enterprise_business_intelligence_v1: true, kpi_engine_enabled: true, ai_forecasting_enabled: true, live_updates_enabled: true, executive_reports_enabled: true, scheduled_reports_enabled: true, visual_analytics_enabled: true },
    pendingPublish: false,
    health: { status: "healthy", score: 94, message: "ok" },
    ...overrides,
  };
}

describe("enterprise bi descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.id).toBe("enterprise-business-intelligence");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/business-intelligence");
  });

  it("has master feature flag", () => {
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_business_intelligence_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-business-intelligence")?.id).toBe("enterprise-business-intelligence");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-business-intelligence")?.moduleId).toBe("enterprise-business-intelligence");
  });

  it("lists routes", () => {
    expect(ENTERPRISE_BI_ROUTES.length).toBeGreaterThanOrEqual(11);
  });

  it("relates to ai os and analytics", () => {
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
    expect(ENTERPRISE_BI_MODULE_DESCRIPTOR.relatedModules).toContain("analytics-engine");
  });
});

describe("executive dashboard", () => {
  it("builds dashboard", () => {
    const dashboard = buildExecutiveDashboard(createDefaultBiState(), createDefaultBiSettings());
    expect(dashboard.revenue).toBeGreaterThan(0);
    expect(dashboard.gmv).toBeGreaterThan(dashboard.orders);
    expect(dashboard.platformHealth).toBeGreaterThan(0);
  });

  it("includes conversion rate", () => {
    const dashboard = buildExecutiveDashboard(createDefaultBiState(), createDefaultBiSettings());
    expect(dashboard.conversionRate).toBeGreaterThan(0);
  });

  it("refreshes metrics", () => {
    const refreshed = refreshBiMetrics(createDefaultBiState());
    expect(refreshed.kpis.length).toBeGreaterThan(0);
    expect(refreshed.forecasts.length).toBeGreaterThan(0);
  });
});

describe("kpi engine", () => {
  it("creates default kpis", () => {
    expect(createDefaultKpis()).toHaveLength(8);
  });

  it("validates kpi period", () => {
    expect(isValidKpiPeriod("monthly")).toBe(true);
    expect(KPI_PERIODS).toHaveLength(6);
  });

  it("creates kpi with change percent", () => {
    const kpi = createKpi("Test", 110, 100, "weekly");
    expect(kpi.changePercent).toBe(10);
  });

  it("recalculates kpis for period", () => {
    const kpis = recalculateKpis(createDefaultKpis(), "daily");
    expect(kpis[0]?.period).toBe("daily");
  });

  it("detects positive trend", () => {
    expect(kpiTrendPositive(createKpi("R", 110, 100, "monthly"))).toBe(true);
  });

  it("aggregates kpi score", () => {
    expect(aggregateKpiScore(createDefaultKpis())).toBeGreaterThan(50);
  });
});

describe("financial analytics", () => {
  it("creates financial breakdown", () => {
    expect(createDefaultFinancialBreakdown().length).toBeGreaterThan(0);
  });

  it("validates financial metric", () => {
    expect(isValidFinancialMetric("revenue")).toBe(true);
  });

  it("calculates total revenue", () => {
    expect(totalRevenue(createDefaultFinancialBreakdown())).toBeGreaterThan(0);
  });

  it("calculates net profit", () => {
    expect(netProfit(createDefaultFinancialBreakdown())).toBeGreaterThan(0);
  });
});

describe("marketplace analytics", () => {
  it("creates marketplace data", () => {
    const data = createDefaultMarketplaceAnalytics();
    expect(data["top-categories"]?.length).toBeGreaterThan(0);
    expect(data["top-sellers"]?.length).toBeGreaterThan(0);
  });

  it("sorts leaderboard", () => {
    const sorted = topByValue(createDefaultMarketplaceAnalytics()["top-categories"] ?? []);
    expect(sorted[0]?.rank).toBeLessThanOrEqual(sorted[1]?.rank ?? 0);
  });
});

describe("user and traffic analytics", () => {
  it("creates user analytics", () => {
    expect(createDefaultUserAnalytics().registrations).toBeGreaterThan(0);
  });

  it("computes verified rate", () => {
    expect(verifiedRate(createDefaultUserAnalytics())).toBeGreaterThan(0);
  });

  it("creates traffic analytics", () => {
    expect(createDefaultTrafficAnalytics().visitors).toBeGreaterThan(0);
  });

  it("computes conversion from traffic", () => {
    const rate = conversionFromTraffic(createDefaultTrafficAnalytics(), 18420);
    expect(rate).toBeGreaterThan(0);
  });
});

describe("forecast engine", () => {
  it("generates forecasts", () => {
    expect(generateForecasts().length).toBe(FORECAST_TYPES.length);
  });

  it("validates forecast type", () => {
    expect(isValidForecastType("revenue")).toBe(true);
  });

  it("runs specific forecast", () => {
    expect(runForecast("revenue")?.type).toBe("revenue");
  });

  it("covers all forecast types", () => {
    expect(coversAllForecastTypes(generateForecasts())).toBe(true);
  });

  it("computes average confidence", () => {
    expect(averageForecastConfidence(generateForecasts())).toBeGreaterThan(70);
  });
});

describe("ai integration", () => {
  it("generates ai insights", () => {
    expect(generateBiAiInsights(generateForecasts()).length).toBeGreaterThan(0);
  });

  it("includes all ai sources", () => {
    expect(allAiSourcesPresent(generateForecasts())).toBe(true);
  });

  it("counts scan patterns", () => {
    expect(scanPatternCount(generateForecasts())).toBeGreaterThan(0);
  });

  it("counts sentinel risks", () => {
    expect(sentinelRiskCount(generateForecasts())).toBeGreaterThan(0);
  });

  it("counts omega forecasts", () => {
    expect(omegaForecastCount(generateForecasts())).toBeGreaterThan(0);
  });
});

describe("reports", () => {
  it("creates default reports", () => {
    expect(createDefaultReports().length).toBeGreaterThan(0);
  });

  it("validates report type", () => {
    expect(isValidReportType("revenue")).toBe(true);
    expect(REPORT_TYPES).toHaveLength(8);
  });

  it("generates report", () => {
    const report = generateReport("marketplace");
    expect(report.type).toBe("marketplace");
  });

  it("formats markdown", () => {
    expect(formatReportMarkdown(generateReport("revenue"))).toContain("# Revenue Report");
  });
});

describe("compliance", () => {
  it("lists frameworks via reports context", () => {
    expect(listComplianceFrameworks().length).toBeGreaterThan(0);
  });

  it("computes compliance score", () => {
    expect(complianceScore(listComplianceFrameworks())).toBeGreaterThan(80);
  });
});

describe("export", () => {
  it("exports json", () => {
    expect(exportBiSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv", () => {
    expect(exportBiSnapshot(sampleSnapshot(), "csv")).toContain("label,value");
  });

  it("exports excel as csv", () => {
    expect(exportBiSnapshot(sampleSnapshot(), "excel")).toContain("label,value");
  });

  it("validates export format", () => {
    expect(isValidBiExportFormat("pdf")).toBe(true);
  });

  it("parses import", () => {
    expect(parseBiImportPayload('{"kpis":[]}')).toEqual({ kpis: [] });
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformBiAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for export", () => {
    expect(canPerformBiAction({ action: "export", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformBiAction({ action: "export", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for import", () => {
    expect(requiresMfaForBi("import")).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createBiAuditEntry("forecast", "admin", "revenue").action).toBe("forecast");
  });

  it("identifies config actions", () => {
    expect(isBiConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes bi health", () => {
    expect(computeBiHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled", () => {
    expect(computeBiHealth(sampleSnapshot({ featureFlagsConfig: { enterprise_business_intelligence_v1: false } as BiSnapshot["featureFlagsConfig"] })).status).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateBiReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(ENTERPRISE_BI_API.snapshot).toBe("/api/super-admin/business-intelligence");
  });

  it("exposes action endpoints", () => {
    expect(ENTERPRISE_BI_API.refresh).toContain("refresh");
    expect(ENTERPRISE_BI_API.calculate).toContain("calculate");
    expect(ENTERPRISE_BI_API.forecast).toContain("forecast");
    expect(ENTERPRISE_BI_API.export).toContain("export");
    expect(ENTERPRISE_BI_API.import).toContain("import");
  });

  it("exposes v1 snapshot", () => {
    expect(ENTERPRISE_BI_API.v1Snapshot).toContain("/api/v1/");
  });
});
