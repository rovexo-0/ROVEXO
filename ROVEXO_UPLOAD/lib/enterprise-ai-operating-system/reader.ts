import type { AiOsSnapshot, AiOsTab } from "@/lib/enterprise-ai-operating-system/types";
import {
  detectAiOsPendingPublish,
  getAiOsDraftDocument,
  getAiOsLiveDocument,
  aiOsConfigLifecycle,
} from "@/lib/enterprise-ai-operating-system/config";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import { buildAiOsDashboard } from "@/lib/enterprise-ai-operating-system/engine";
import { computeSentinelScores } from "@/lib/enterprise-ai-operating-system/sentinel";
import { listAutomationSuggestions, buildAutomationQueue } from "@/lib/enterprise-ai-operating-system/automation";

export async function getAiOsSnapshot(tab: AiOsTab = "dashboard"): Promise<AiOsSnapshot> {
  const live = await getAiOsLiveDocument();
  const draft = await getAiOsDraftDocument();
  const { scans, alerts, recommendations, predictions, repairs, models, incidents, ...settings } = live.settings;
  const flags = live.featureFlags;
  const enabled = flags.ai_os_enabled !== false;
  const dashboard = buildAiOsDashboard(live.settings, settings);
  const sentinelScores = computeSentinelScores(alerts);
  const history = await aiOsConfigLifecycle.getHistory();
  const healthScore = enabled
    ? Math.round((dashboard.aiHealthScore + sentinelScores.securityScore) / 2)
    : 0;

  return {
    tab,
    dashboard,
    sentinelScores,
    scans,
    alerts,
    recommendations,
    predictions,
    repairs,
    models,
    incidents,
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
    pendingPublish: detectAiOsPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Enterprise AI OS operational" : "AI OS disabled",
    },
  };
}

export async function getAiOsPageData(tab: AiOsTab = "dashboard") {
  const snapshot = await getAiOsSnapshot(tab);
  const automationQueue = buildAutomationQueue(listAutomationSuggestions());
  return { snapshot, descriptor: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR, automationQueue };
}

export function validateAiOsReadiness(snapshot: AiOsSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlags.ai_os_enabled !== false,
    snapshot.featureFlags.scan_engine_enabled !== false,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
