import type { BiSnapshot, BiTab } from "@/lib/enterprise-business-intelligence/types";
import { detectBiPendingPublish, getBiDraftDocument, getBiLiveDocument, biConfigLifecycle } from "@/lib/enterprise-business-intelligence/config";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { buildExecutiveDashboard, createDefaultBiSettings } from "@/lib/enterprise-business-intelligence/engine";

export async function getBiSnapshot(tab: BiTab = "dashboard"): Promise<BiSnapshot> {
  const live = await getBiLiveDocument();
  const draft = await getBiDraftDocument();
  const { kpis, financial, marketplace, userAnalytics, traffic, forecasts, reports, ...settingsFields } = live.settings;
  const settings = { ...createDefaultBiSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_business_intelligence_v1 !== false;
  const state = { kpis, financial, marketplace, userAnalytics, traffic, forecasts, reports };
  const dashboard = buildExecutiveDashboard(state, settings);
  const history = await biConfigLifecycle.getHistory();
  const healthScore = enabled ? dashboard.platformHealth : 0;

  return {
    tab,
    dashboard,
    kpis: flags.kpi_engine_enabled !== false ? kpis : [],
    financial,
    marketplace,
    userAnalytics,
    traffic,
    forecasts: flags.ai_forecasting_enabled !== false ? forecasts : [],
    reports: flags.executive_reports_enabled !== false ? reports : [],
    settings,
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectBiPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Business Intelligence Center operational" : "BI Center disabled",
    },
  };
}

export async function getBiPageData(tab: BiTab = "dashboard") {
  const snapshot = await getBiSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_BI_MODULE_DESCRIPTOR };
}

export function validateBiReadiness(snapshot: BiSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_business_intelligence_v1 !== false,
    snapshot.kpis.length > 0,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
