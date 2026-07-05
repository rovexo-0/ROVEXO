import type { BiSettings, BiState, ExecutiveDashboard } from "@/lib/enterprise-business-intelligence/types";
import { createDefaultKpis } from "@/lib/enterprise-business-intelligence/kpis";
import { createDefaultFinancialBreakdown, netProfit, totalRevenue } from "@/lib/enterprise-business-intelligence/financial";
import { createDefaultMarketplaceAnalytics } from "@/lib/enterprise-business-intelligence/marketplace";
import { createDefaultUserAnalytics } from "@/lib/enterprise-business-intelligence/users";
import { conversionFromTraffic, createDefaultTrafficAnalytics } from "@/lib/enterprise-business-intelligence/traffic";
import { generateForecasts } from "@/lib/enterprise-business-intelligence/forecasting";
import { createDefaultReports } from "@/lib/enterprise-business-intelligence/reports";

export function createDefaultBiSettings(): BiSettings {
  return {
    defaultPeriod: "monthly",
    liveUpdatesEnabled: true,
    scheduledReportsEnabled: true,
    mfaRequired: true,
    autoRefreshMinutes: 15,
  };
}

export function createDefaultBiState(): BiState {
  const financial = createDefaultFinancialBreakdown();
  const kpis = createDefaultKpis();
  const traffic = createDefaultTrafficAnalytics();
  const userAnalytics = createDefaultUserAnalytics();

  return {
    kpis,
    financial,
    marketplace: createDefaultMarketplaceAnalytics(),
    userAnalytics,
    traffic,
    forecasts: generateForecasts(),
    reports: createDefaultReports(),
  };
}

export function buildExecutiveDashboard(state: BiState): ExecutiveDashboard {
  const revenue = totalRevenue(state.financial);
  const profit = netProfit(state.financial);
  const orders = state.kpis.find((k) => k.label === "Orders")?.value ?? 0;
  const gmv = state.kpis.find((k) => k.label === "GMV")?.value ?? 0;
  const visitors = state.traffic.visitors;
  const conversionRate = conversionFromTraffic(state.traffic, orders);
  const platformHealth = state.kpis.find((k) => k.label === "Platform Health")?.value ?? 90;

  return {
    revenue,
    profit,
    orders,
    gmv,
    visitors,
    conversionRate,
    activeBuyers: state.kpis.find((k) => k.label === "Active Buyers")?.value ?? 0,
    activeSellers: state.kpis.find((k) => k.label === "Active Sellers")?.value ?? 0,
    newRegistrations: state.userAnalytics.registrations,
    pendingReviews: 142,
    platformHealth,
    marketplaceGrowth: state.kpis.find((k) => k.label === "Revenue")?.changePercent ?? 0,
  };
}

export function refreshBiMetrics(state: BiState, period = createDefaultBiSettings().defaultPeriod): BiState {
  return {
    ...state,
    kpis: createDefaultKpis(period),
    forecasts: generateForecasts(),
  };
}
