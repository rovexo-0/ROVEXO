import type { OmegaSnapshot } from "@/lib/omega-command-center/types";
import {
  detectOmegaPendingPublish,
  getOmegaDraftDocument,
  getOmegaLiveDocument,
  omegaConfigLifecycle,
} from "@/lib/omega-command-center/config";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import { createOmegaSettings } from "@/lib/omega-command-center/orchestrator";

export async function getOmegaSnapshot(): Promise<OmegaSnapshot> {
  const live = await getOmegaLiveDocument();
  const draft = await getOmegaDraftDocument();
  const {
    enterpriseScore,
    healthCards,
    engineStates,
    activeScan,
    recommendations,
    executiveReport,
    timeline,
    liveMonitor,
    ...settingsFields
  } = live.settings;
  const settings = { ...createOmegaSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.omega_command_center_v1 !== false;
  const history = await omegaConfigLifecycle.getHistory();
  const score = enabled ? enterpriseScore : 0;

  return {
    dashboard: {
      enterpriseScore: score,
      healthCards: flags.omega_live_monitor_enabled !== false ? healthCards : [],
      engineStates,
      activeScan,
      recommendations: flags.omega_auto_repair_enabled !== false ? recommendations : [],
      executiveReport: flags.omega_executive_reports_enabled !== false ? executiveReport : undefined,
      timeline,
      liveMonitor: flags.omega_live_monitor_enabled !== false ? liveMonitor : [],
    },
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
    pendingPublish: detectOmegaPendingPublish(draft, live),
    health: {
      status: score >= 80 ? "healthy" : score >= 50 ? "warning" : "failed",
      score,
      message: enabled ? "OMEGA Command Center operational" : "OMEGA disabled",
    },
  };
}

export async function getOmegaPageData() {
  const snapshot = await getOmegaSnapshot();
  return { snapshot, descriptor: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR };
}

export function validateOmegaReadiness(snapshot: OmegaSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.omega_command_center_v1 !== false,
    snapshot.dashboard.engineStates.length === 7,
    snapshot.health.score >= 50,
  ];
  const readinessScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: readinessScore >= 75, score: readinessScore };
}
