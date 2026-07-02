import type { E2eValidationSnapshot, E2eValidationTab } from "@/lib/enterprise-e2e-validation-engine/types";
import {
  detectE2eValidationPendingPublish,
  getE2eValidationDraftDocument,
  getE2eValidationLiveDocument,
  e2eValidationConfigLifecycle,
} from "@/lib/enterprise-e2e-validation-engine/config";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";
import { computeE2eEnterpriseScore, createDefaultE2eValidationSettings } from "@/lib/enterprise-e2e-validation-engine/engine";

export async function getE2eValidationSnapshot(tab: E2eValidationTab = "dashboard"): Promise<E2eValidationSnapshot> {
  const live = await getE2eValidationLiveDocument();
  const draft = await getE2eValidationDraftDocument();
  const {
    dashboard,
    omegaScores,
    uiValidations,
    routeValidations,
    buyerFlows,
    sellerFlows,
    companyFlows,
    superAdminFlows,
    databaseValidations,
    apiValidations,
    businessRules,
    regressionRuns,
    failures,
    reports,
    auditEntries,
    fullValidationEnabled,
    regressionAutoTrigger,
    validationOnlyMode,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
  } = live.settings;
  const settings = {
    ...createDefaultE2eValidationSettings(),
    fullValidationEnabled,
    regressionAutoTrigger,
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_e2e_validation_engine_v1 !== false;
  const enterpriseScore = enabled ? computeE2eEnterpriseScore({ dashboard, omegaScores }) : 0;
  const history = await e2eValidationConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassRate: 0, enterpriseScore: 0, certificationEligible: false },
    omegaScores: flags.omega_score_engine_enabled !== false ? omegaScores : [],
    uiValidations: flags.full_ui_validation_enabled !== false ? uiValidations : [],
    routeValidations,
    buyerFlows: flags.workflow_validation_enabled !== false ? buyerFlows : [],
    sellerFlows: flags.workflow_validation_enabled !== false ? sellerFlows : [],
    companyFlows: flags.workflow_validation_enabled !== false ? companyFlows : [],
    superAdminFlows: flags.workflow_validation_enabled !== false ? superAdminFlows : [],
    databaseValidations: flags.database_validation_enabled !== false ? databaseValidations : [],
    apiValidations: flags.api_validation_enabled !== false ? apiValidations : [],
    businessRules: flags.business_rule_validation_enabled !== false ? businessRules : [],
    regressionRuns: flags.regression_auto_trigger_enabled !== false ? regressionRuns : [],
    failures,
    reports,
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
    pendingPublish: detectE2eValidationPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 95 ? "healthy" : enterpriseScore >= 80 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Enterprise E2E Validation Engine operational — validation-only mode" : "E2E Validation Engine disabled",
    },
  };
}

export async function getE2eValidationPageData(tab: E2eValidationTab = "dashboard") {
  const snapshot = await getE2eValidationSnapshot(tab);
  return { snapshot, descriptor: E2E_VALIDATION_MODULE_DESCRIPTOR };
}

export function validateE2eValidationReadiness(snapshot: E2eValidationSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_e2e_validation_engine_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassRate >= 90,
    snapshot.omegaScores.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
