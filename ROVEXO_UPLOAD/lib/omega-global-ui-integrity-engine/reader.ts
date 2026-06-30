import type { GlobalUiIntegritySnapshot, GlobalUiIntegrityTab } from "@/lib/omega-global-ui-integrity-engine/types";
import {
  detectGlobalUiIntegrityPendingPublish,
  getGlobalUiIntegrityDraftDocument,
  getGlobalUiIntegrityLiveDocument,
  globalUiIntegrityConfigLifecycle,
} from "@/lib/omega-global-ui-integrity-engine/config";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";
import { computeGlobalUiEnterpriseScore, createDefaultGlobalUiIntegritySettings } from "@/lib/omega-global-ui-integrity-engine/engine";

export async function getGlobalUiIntegritySnapshot(tab: GlobalUiIntegrityTab = "dashboard"): Promise<GlobalUiIntegritySnapshot> {
  const live = await getGlobalUiIntegrityLiveDocument();
  const draft = await getGlobalUiIntegrityDraftDocument();
  const {
    dashboard,
    omegaScores,
    screens,
    uiValidation,
    uxValidation,
    navigation,
    categories,
    layout,
    autoRepairActions,
    globalScan,
    failures,
    productionRequirements,
    reports,
    auditEntries,
    validationOnlyMode,
    blockProtectedAreaFixes,
    autoRepairEnabled,
    requireApprovalForBusinessLogic,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    requirePass100,
    inheritToFutureModules,
  } = live.settings;
  const settings = {
    ...createDefaultGlobalUiIntegritySettings(),
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    autoRepairEnabled,
    requireApprovalForBusinessLogic,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    requirePass100: requirePass100 ?? true,
    inheritToFutureModules: inheritToFutureModules ?? true,
  };
  const flags = live.featureFlags;
  const enabled = flags.omega_global_ui_integrity_engine_v1 !== false;
  const enterpriseScore = enabled ? computeGlobalUiEnterpriseScore({ dashboard, omegaScores }) : 0;
  const history = await globalUiIntegrityConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassPercent: 0, enterpriseScore: 0, certificationGranted: false, productionReady: false, launchReady: false },
    omegaScores: enabled ? omegaScores : [],
    screens: enabled ? screens : [],
    uiValidation: flags.global_ui_validation_enabled !== false ? uiValidation : [],
    uxValidation: flags.global_ux_validation_enabled !== false ? uxValidation : [],
    navigation: flags.global_navigation_validation_enabled !== false ? navigation : [],
    categories: flags.global_category_validation_enabled !== false ? categories : [],
    layout: flags.global_layout_optimization_enabled !== false ? layout : [],
    autoRepairActions: flags.global_auto_repair_enabled !== false ? autoRepairActions : [],
    globalScan,
    failures,
    productionRequirements,
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
    pendingPublish: detectGlobalUiIntegrityPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 100 ? "healthy" : enterpriseScore >= 90 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "OMEGA Global UI Integrity — PASS 100% across platform" : "Global UI Integrity Engine disabled",
    },
  };
}

export async function getGlobalUiIntegrityPageData(tab: GlobalUiIntegrityTab = "dashboard") {
  const snapshot = await getGlobalUiIntegritySnapshot(tab);
  return { snapshot, descriptor: GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR };
}

export function validateGlobalUiIntegrityReadiness(snapshot: GlobalUiIntegritySnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.omega_global_ui_integrity_engine_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassPercent >= 100,
    snapshot.dashboard.certificationGranted === true,
    snapshot.globalScan.certificationEligible === true,
    snapshot.productionRequirements.every((r) => r.status === "pass"),
    snapshot.omegaScores.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 80, score };
}
