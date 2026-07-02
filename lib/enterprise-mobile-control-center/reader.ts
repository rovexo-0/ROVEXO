import type { MobileCcSnapshot, MobileCcTab } from "@/lib/enterprise-mobile-control-center/types";
import {
  detectMobileCcPendingPublish,
  getMobileCcDraftDocument,
  getMobileCcLiveDocument,
  mobileCcConfigLifecycle,
} from "@/lib/enterprise-mobile-control-center/config";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import { buildMobileCcDashboard } from "@/lib/enterprise-mobile-control-center/engine";
import { buildMobileAnalytics } from "@/lib/enterprise-mobile-control-center/analytics";

export async function getMobileCcSnapshot(tab: MobileCcTab = "dashboard"): Promise<MobileCcSnapshot> {
  const live = await getMobileCcLiveDocument();
  const draft = await getMobileCcDraftDocument();
  const {
    builds, releases, devices, downloads, otaUpdates, pushCampaigns,
    buildHistory, aiInsights, aiSuggestions, ...settings
  } = live.settings;
  const flags = live.featureFlags;
  const enabled = flags.mobile_cc_enabled !== false;
  const dashboard = buildMobileCcDashboard(live.settings, settings);
  const analytics = buildMobileAnalytics(devices);
  const history = await mobileCcConfigLifecycle.getHistory();
  const healthScore = enabled ? dashboard.releaseHealth : 0;

  return {
    tab,
    dashboard,
    analytics,
    builds,
    releases,
    devices,
    downloads,
    otaUpdates,
    pushCampaigns,
    buildHistory,
    aiInsights: flags.ai_monitoring_enabled !== false ? aiInsights : [],
    aiSuggestions: flags.ai_monitoring_enabled !== false ? aiSuggestions : [],
    history: history.map((h) => ({
      id: h.id,
      action: "publish",
      actor: h.publishedBy,
      timestamp: h.publishedAt,
    })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlags: flags,
    pendingPublish: detectMobileCcPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Mobile Control Center operational" : "Mobile Control Center disabled",
    },
  };
}

export async function getMobileCcPageData(tab: MobileCcTab = "dashboard") {
  const snapshot = await getMobileCcSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR };
}

export function validateMobileCcReadiness(snapshot: MobileCcSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlags.mobile_cc_enabled !== false,
    snapshot.devices.length > 0,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
