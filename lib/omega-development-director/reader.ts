import type { DevDirectorSnapshot, DevDirectorTab } from "@/lib/omega-development-director/types";
import {
  detectDevDirectorPendingPublish,
  getDevDirectorDraftDocument,
  getDevDirectorLiveDocument,
  devDirectorConfigLifecycle,
} from "@/lib/omega-development-director/config";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";
import { computeDevDirectorEnterpriseScore, createDefaultDevDirectorSettings } from "@/lib/omega-development-director/engine";

export async function getDevDirectorSnapshot(tab: DevDirectorTab = "dashboard"): Promise<DevDirectorSnapshot> {
  const live = await getDevDirectorLiveDocument();
  const draft = await getDevDirectorDraftDocument();
  const {
    dashboard,
    boardMetrics,
    codeAnalysis,
    discoveries,
    implementations,
    roadmap,
    dependencyGraph,
    pipeline,
    repairProposals,
    insights,
    coordinations,
    auditEntries,
    autonomousAnalysisEnabled,
    recommendationOnlyMode,
    blockProtectedAreaChanges,
    coordinateWithQa,
    coordinateWithGovernance,
  } = live.settings;
  const settings = {
    ...createDefaultDevDirectorSettings(),
    autonomousAnalysisEnabled,
    recommendationOnlyMode: recommendationOnlyMode ?? true,
    blockProtectedAreaChanges,
    coordinateWithQa,
    coordinateWithGovernance,
  };
  const flags = live.featureFlags;
  const enabled = flags.omega_development_director_v1 !== false;
  const enterpriseScore = enabled ? computeDevDirectorEnterpriseScore({ dashboard, boardMetrics }) : 0;
  const history = await devDirectorConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, developmentProgress: 0, enterpriseScore: 0 },
    boardMetrics: enabled ? boardMetrics : [],
    codeAnalysis: flags.autonomous_code_analysis_enabled !== false ? codeAnalysis : [],
    discoveries: flags.development_discovery_enabled !== false ? discoveries : [],
    implementations,
    roadmap: flags.roadmap_engine_enabled !== false ? roadmap : [],
    dependencyGraph: flags.dependency_graph_enabled !== false ? dependencyGraph : { nodes: [], issues: [] },
    pipeline,
    repairProposals: flags.safe_repair_mode_enabled !== false ? repairProposals : [],
    insights,
    coordinations: flags.enterprise_coordination_enabled !== false ? coordinations : [],
    auditEntries,
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
    pendingPublish: detectDevDirectorPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 95 ? "healthy" : enterpriseScore >= 80 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "OMEGA Development Director operational — recommendation-only mode" : "Development Director disabled",
    },
  };
}

export async function getDevDirectorPageData(tab: DevDirectorTab = "dashboard") {
  const snapshot = await getDevDirectorSnapshot(tab);
  return { snapshot, descriptor: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR };
}

export function validateDevDirectorReadiness(snapshot: DevDirectorSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.omega_development_director_v1 !== false,
    snapshot.settings.recommendationOnlyMode === true,
    snapshot.dashboard.developmentProgress >= 75,
    snapshot.coordinations.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
