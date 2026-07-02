import type { QaSnapshot, QaTab } from "@/lib/omega-quality-assurance-center/types";
import {
  detectQaPendingPublish,
  getQaDraftDocument,
  getQaLiveDocument,
  qaConfigLifecycle,
} from "@/lib/omega-quality-assurance-center/config";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";
import { computeQaEnterpriseScore, createDefaultQaSettings } from "@/lib/omega-quality-assurance-center/engine";

export async function getQaSnapshot(tab: QaTab = "dashboard"): Promise<QaSnapshot> {
  const live = await getQaLiveDocument();
  const draft = await getQaDraftDocument();
  const {
    dashboard,
    healthMetrics,
    platformDomains,
    registeredButtons,
    userFlows,
    aiValidations,
    fixCandidates,
    certifications,
    priorityIssues,
    moduleStatuses,
    validationRuns,
    auditEntries,
    priorityModeEnabled,
    autoFixEnabled,
    blockUncertifiedDeploys,
    continuousValidation,
  } = live.settings;
  const settings = {
    ...createDefaultQaSettings(),
    priorityModeEnabled,
    autoFixEnabled,
    blockUncertifiedDeploys,
    continuousValidation,
  };
  const flags = live.featureFlags;
  const enabled = flags.omega_quality_assurance_center_v1 !== false;
  const enterpriseScore = enabled ? computeQaEnterpriseScore({ dashboard, healthMetrics }) : 0;
  const history = await qaConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? dashboard : { ...dashboard, platformHealth: 0, enterpriseScore: 0 },
    healthMetrics: enabled ? healthMetrics : [],
    platformDomains: flags.continuous_validation_enabled !== false ? platformDomains : [],
    registeredButtons: flags.button_validation_engine_enabled !== false ? registeredButtons : [],
    userFlows: flags.user_flow_validation_enabled !== false ? userFlows : [],
    aiValidations: flags.ai_validation_enabled !== false ? aiValidations : [],
    fixCandidates: flags.autonomous_fix_engine_enabled !== false ? fixCandidates : [],
    certifications: flags.certification_pipeline_enabled !== false ? certifications : [],
    priorityIssues: flags.omega_priority_mode_enabled !== false ? priorityIssues : [],
    moduleStatuses,
    validationRuns,
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
    pendingPublish: detectQaPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 95 ? "healthy" : enterpriseScore >= 80 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "OMEGA Quality Assurance Center operational" : "QA Center disabled",
    },
  };
}

export async function getQaPageData(tab: QaTab = "dashboard") {
  const snapshot = await getQaSnapshot(tab);
  return { snapshot, descriptor: OMEGA_QA_MODULE_DESCRIPTOR };
}

export function validateQaReadiness(snapshot: QaSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.omega_quality_assurance_center_v1 !== false,
    snapshot.dashboard.platformHealth >= 90,
    snapshot.dashboard.buttonCoverage >= 85,
    snapshot.validationRuns.some((run) => run.status === "completed"),
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
