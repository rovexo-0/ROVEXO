import type { DevelopmentSnapshot, DevelopmentTab } from "@/lib/enterprise-development-center/types";
import {
  detectDevelopmentPendingPublish,
  getDevelopmentDraftDocument,
  getDevelopmentLiveDocument,
  developmentConfigLifecycle,
} from "@/lib/enterprise-development-center/config";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import { createDefaultDevelopmentSettings } from "@/lib/enterprise-development-center/engine";

export async function getDevelopmentSnapshot(tab: DevelopmentTab = "dashboard"): Promise<DevelopmentSnapshot> {
  const live = await getDevelopmentLiveDocument();
  const draft = await getDevelopmentDraftDocument();
  const {
    dashboard,
    projectTree,
    modules,
    architectureNodes,
    dependencyLinks,
    apiEndpoints,
    databaseTables,
    storageBuckets,
    builds,
    releases,
    aiEngines,
    technicalDebt,
    codeQuality,
    performanceMetrics,
    validationResults,
    ...settingsFields
  } = live.settings;
  const settings = { ...createDefaultDevelopmentSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_development_center_v1 !== false;
  const history = await developmentConfigLifecycle.getHistory();
  const score = enabled ? dashboard.enterpriseScore : 0;

  return {
    tab,
    dashboard: enabled ? dashboard : { ...dashboard, enterpriseScore: 0 },
    projectTree,
    modules,
    architectureNodes: flags.architecture_studio_enabled !== false ? architectureNodes : [],
    dependencyLinks,
    apiEndpoints,
    databaseTables,
    storageBuckets,
    builds: flags.devsecops_enabled !== false ? builds : [],
    releases: flags.release_pipeline_enabled !== false ? releases : [],
    aiEngines: flags.ai_integration_panel_enabled !== false ? aiEngines : [],
    technicalDebt,
    codeQuality: flags.code_quality_enabled !== false ? codeQuality : [],
    performanceMetrics,
    validationResults,
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
    pendingPublish: detectDevelopmentPendingPublish(draft, live),
    health: {
      status: score >= 95 ? "healthy" : score >= 80 ? "warning" : "failed",
      score,
      message: enabled ? "Enterprise Development Center operational" : "Development Center disabled",
    },
  };
}

export async function getDevelopmentPageData(tab: DevelopmentTab = "dashboard") {
  const snapshot = await getDevelopmentSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR };
}

export function validateDevelopmentReadiness(snapshot: DevelopmentSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_development_center_v1 !== false,
    snapshot.modules.length > 0,
    snapshot.validationResults.every((v) => v.status === "pass"),
  ];
  const readinessScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: readinessScore >= 75, score: readinessScore };
}
