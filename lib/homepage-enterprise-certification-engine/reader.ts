import type { HomepageCertificationSnapshot, HomepageCertificationTab } from "@/lib/homepage-enterprise-certification-engine/types";
import {
  detectHomepageCertificationPendingPublish,
  getHomepageCertificationDraftDocument,
  getHomepageCertificationLiveDocument,
  homepageCertificationConfigLifecycle,
} from "@/lib/homepage-enterprise-certification-engine/config";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";
import { computeHomepageEnterpriseScore, createDefaultHomepageCertificationSettings } from "@/lib/homepage-enterprise-certification-engine/engine";
import { runFullHomepageEngineeringScan } from "@/lib/homepage-engineering-director";
import { runHomepageCategoryIntegrityScan } from "@/lib/homepage-category-integrity-engine";

export async function getHomepageCertificationSnapshot(tab: HomepageCertificationTab = "dashboard"): Promise<HomepageCertificationSnapshot> {
  const live = await getHomepageCertificationLiveDocument();
  const draft = await getHomepageCertificationDraftDocument();
  const {
    dashboard,
    omegaScores,
    sections,
    buttons,
    search,
    categories,
    listings,
    responsive,
    performance,
    accessibility,
    seo,
    integrity,
    integrityScan,
    engineeringScan,
    duplicationFindings,
    layoutFindings,
    certificationRuns,
    failures,
    reports,
    auditEntries,
    validationOnlyMode,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    requirePass100,
  } = live.settings;
  const settings = {
    ...createDefaultHomepageCertificationSettings(),
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    requirePass100: requirePass100 ?? true,
  };
  const flags = live.featureFlags;
  const enabled = flags.homepage_enterprise_certification_engine_v1 !== false;
  const enterpriseScore = enabled ? computeHomepageEnterpriseScore({ dashboard, omegaScores }) : 0;
  const history = await homepageCertificationConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassPercent: 0, enterpriseScore: 0, certificationGranted: false, productionReady: false },
    omegaScores: flags.omega_score_engine_enabled !== false ? omegaScores : [],
    sections: flags.section_validation_enabled !== false ? sections : [],
    buttons: flags.button_validation_enabled !== false ? buttons : [],
    search: flags.search_validation_enabled !== false ? search : [],
    categories,
    listings,
    responsive: flags.responsive_validation_enabled !== false ? responsive : [],
    performance: flags.performance_validation_enabled !== false ? performance : [],
    accessibility: flags.accessibility_validation_enabled !== false ? accessibility : [],
    seo: flags.seo_validation_enabled !== false ? seo : [],
    integrity: flags.homepage_integrity_engine_v1 !== false ? integrity : [],
    integrityScan: flags.homepage_integrity_engine_v1 !== false ? integrityScan : runHomepageCategoryIntegrityScan({ cycle: "homepage-validation" }),
    engineeringScan: flags.homepage_integrity_engine_v1 !== false ? engineeringScan : runFullHomepageEngineeringScan(),
    duplicationFindings: flags.category_duplication_detection !== false ? duplicationFindings : [],
    layoutFindings: flags.layout_optimization_enabled !== false ? layoutFindings : [],
    certificationRuns,
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
    pendingPublish: detectHomepageCertificationPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 100 ? "healthy" : enterpriseScore >= 90 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Homepage Enterprise Certification — PASS 100% reference implementation" : "Homepage Certification Engine disabled",
    },
  };
}

export async function getHomepageCertificationPageData(tab: HomepageCertificationTab = "dashboard") {
  const snapshot = await getHomepageCertificationSnapshot(tab);
  return { snapshot, descriptor: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR };
}

export function validateHomepageCertificationReadiness(snapshot: HomepageCertificationSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.homepage_enterprise_certification_engine_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassPercent >= 100,
    snapshot.dashboard.certificationGranted === true,
    snapshot.dashboard.productionReady === true,
    snapshot.omegaScores.length > 0,
    snapshot.integrityScan?.certificationEligible !== false,
    snapshot.engineeringScan?.certificationEligible !== false,
    snapshot.engineeringScan?.passPercent >= 100,
    snapshot.integrity.every((item) => item.status === "pass"),
    snapshot.engineeringScan?.productionGates.every((gate) => gate.status === "pass") !== false,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 80, score };
}
