import type { GovernanceSnapshot, GovernanceTab } from "@/lib/enterprise-governance-center/types";
import {
  detectGovernancePendingPublish,
  getGovernanceDraftDocument,
  getGovernanceLiveDocument,
  governanceConfigLifecycle,
} from "@/lib/enterprise-governance-center/config";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import { computeOverallScore, createDefaultGovernanceSettings } from "@/lib/enterprise-governance-center/engine";

export async function getGovernanceSnapshot(tab: GovernanceTab = "constitution"): Promise<GovernanceSnapshot> {
  const live = await getGovernanceLiveDocument();
  const draft = await getGovernanceDraftDocument();
  const {
    constitution,
    architectureViolations,
    moduleCompliance,
    rules,
    technicalDebt,
    enterpriseScores,
    certificates,
    auditEntries,
    validationRuns,
    amendments,
    ...settingsFields
  } = live.settings;
  const settings = { ...createDefaultGovernanceSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_governance_center_v1 !== false;
  const overallScore = enabled ? computeOverallScore(enterpriseScores) : 0;
  const history = await governanceConfigLifecycle.getHistory();

  return {
    tab,
    constitution: flags.constitution_viewer_enabled !== false ? constitution : [],
    architectureViolations: flags.architecture_governance_enabled !== false ? architectureViolations : [],
    moduleCompliance,
    rules: flags.rule_engine_enabled !== false ? rules : [],
    technicalDebt: flags.technical_debt_tracking_enabled !== false ? technicalDebt : [],
    enterpriseScores,
    overallScore,
    certificates: flags.certification_engine_enabled !== false ? certificates : [],
    auditEntries,
    validationRuns: flags.validation_pipeline_enabled !== false ? validationRuns : [],
    amendments,
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
    pendingPublish: detectGovernancePendingPublish(draft, live),
    health: {
      status: overallScore >= 95 ? "healthy" : overallScore >= 80 ? "warning" : "failed",
      score: overallScore,
      message: enabled ? "Enterprise Governance Center operational" : "Governance Center disabled",
    },
  };
}

export async function getGovernancePageData(tab: GovernanceTab = "constitution") {
  const snapshot = await getGovernanceSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR };
}

export function validateGovernanceReadiness(snapshot: GovernanceSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_governance_center_v1 !== false,
    snapshot.constitution.length > 0,
    snapshot.overallScore >= 80,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
