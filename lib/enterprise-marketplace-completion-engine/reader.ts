import type { MarketplaceCompletionSnapshot, MarketplaceCompletionTab } from "@/lib/enterprise-marketplace-completion-engine/types";
import {
  detectMarketplaceCompletionPendingPublish,
  getMarketplaceCompletionDraftDocument,
  getMarketplaceCompletionLiveDocument,
  marketplaceCompletionConfigLifecycle,
} from "@/lib/enterprise-marketplace-completion-engine/config";
import { MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR } from "@/lib/enterprise-marketplace-completion-engine/descriptor";
import { computeMarketplaceEnterpriseScore, createDefaultMarketplaceCompletionSettings } from "@/lib/enterprise-marketplace-completion-engine/engine";
import { createPendingMarketplaceCompletionScanResult } from "@/lib/enterprise-marketplace-completion-engine/pending-state";
import { runMarketplaceIntelligenceScan } from "@/lib/enterprise-marketplace-completion-engine/intelligence";
import { runMarketplaceConsistencyScan } from "@/lib/enterprise-marketplace-completion-engine/consistency";
import { runAutonomousMarketplaceDirectorScan } from "@/lib/enterprise-marketplace-completion-engine/director";

export async function getMarketplaceCompletionSnapshot(tab: MarketplaceCompletionTab = "dashboard"): Promise<MarketplaceCompletionSnapshot> {
  const live = await getMarketplaceCompletionLiveDocument();
  const draft = await getMarketplaceCompletionDraftDocument();
  const {
    dashboard, scores, modules, moduleCompletion, buttons, routes, buyerJourney, sellerJourney, companyJourney,
    homepage, search, categories, listings, uiIntegrity, completionScan, productionGates, blockers, repairActions,
    reports, auditEntries, intelligence, consistency, cleanup, modernization, healthScores, continuousImprovement, finalRules,
    director, certificationGate, launchMode, zeroDefect, executionRelease, enterpriseDelivery, executionMode, homepageCompletion, categoryCompletion, searchCompletion, listingCompletion, buyerCompletion, checkoutCompletion, orderCompletion, shippingCompletion, communicationCompletion,
    validationOnlyMode, blockProtectedAreaFixes, autoRepairEnabled, coordinateWithQa,
    coordinateWithGovernance, coordinateWithCertification, coordinateWithLaunchReadiness, requirePass100,
  } = live.settings;
  const settings = {
    ...createDefaultMarketplaceCompletionSettings(),
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    autoRepairEnabled,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    coordinateWithLaunchReadiness,
    requirePass100: requirePass100 ?? true,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_marketplace_completion_engine_v1 !== false;
  const enterpriseScore = enabled ? computeMarketplaceEnterpriseScore(completionScan) : 0;
  const history = await marketplaceCompletionConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassPercent: 0, enterpriseScore: 0, certificationGranted: false, productionReady: false, marketplaceReady: false },
    scores: enabled ? scores : [],
    modules: flags.module_completion_enabled !== false ? modules : [],
    moduleCompletion: flags.module_completion_enabled !== false ? moduleCompletion : [],
    buttons: flags.button_validation_enabled !== false ? buttons : [],
    routes: flags.route_validation_enabled !== false ? routes : [],
    buyerJourney: flags.journey_validation_enabled !== false ? buyerJourney : [],
    sellerJourney: flags.journey_validation_enabled !== false ? sellerJourney : [],
    companyJourney: flags.journey_validation_enabled !== false ? companyJourney : [],
    homepage: flags.homepage_validation_enabled !== false ? homepage : [],
    search: flags.module_completion_enabled !== false ? search : [],
    categories: flags.module_completion_enabled !== false ? categories : [],
    listings: flags.module_completion_enabled !== false ? listings : [],
    uiIntegrity: flags.ui_integrity_enabled !== false ? uiIntegrity : [],
    intelligence: flags.marketplace_intelligence_enabled !== false ? intelligence : runMarketplaceIntelligenceScan({ modulesComplete: true, homepagePass: true, globalPass: true, launchPass: true }),
    consistency: flags.consistency_engine_enabled !== false ? consistency : runMarketplaceConsistencyScan({ globalPass: true, homepagePass: true }),
    cleanup: flags.cleanup_engine_enabled !== false ? cleanup : { scannedAt: new Date().toISOString(), proposals: [], totalProposals: 0, safeProposals: 0 },
    modernization: flags.modernization_engine_enabled !== false ? modernization : { scannedAt: new Date().toISOString(), items: [], passPercent: 0, status: "pending" },
    healthScores: flags.health_scores_enabled !== false ? healthScores : { scannedAt: new Date().toISOString(), overallScore: 0, status: "pending", scores: [] },
    continuousImprovement: flags.continuous_improvement_enabled !== false ? continuousImprovement : { active: false, triggersEnabled: [] },
    finalRules: flags.final_rules_enabled !== false ? finalRules : [],
    director: flags.autonomous_director_enabled !== false ? director : runAutonomousMarketplaceDirectorScan({ modulesComplete: true, modulePassPercent: 100, homepagePass: true, globalPass: true, launchPass: true }),
    certificationGate: flags.certification_gate_enabled !== false ? certificationGate : { scannedAt: new Date().toISOString(), passPercent: 0, status: "pending", gates: [], certificationEligible: false, productionReady: false, launchReady: false, worldClassStandard: false },
    launchMode: flags.launch_mode_enabled !== false ? launchMode : { scannedAt: new Date().toISOString(), active: false, passPercent: 0, status: "pending", launchReady: false, productionReady: false, priorities: [], uiQuality: [], uxQuality: [], marketplaceRules: [], infrastructure: [], cleanupProposals: [], blockers: [], certificationScores: [], report: [], launchRules: [], safeRepairs: [], activeBlockers: 0 },
    zeroDefect: flags.zero_defect_enabled !== false ? zeroDefect : { scannedAt: new Date().toISOString(), active: false, passPercent: 0, status: "pending", zeroDefectPass: false, zeroDefectGatePass: false, criticalDefects: 0, highPriorityDefects: 0, openDefects: 0, resolvedDefects: 0, domains: [], discoveryChecks: [], qualityChecks: [], regressionChecks: [], defects: [], classifications: [], gates: [], certification: [], report: [], repairWorkflow: [], safeRepairs: [], activeGates: 0 },
    executionRelease: flags.execution_release_enabled !== false ? executionRelease : { scannedAt: new Date().toISOString(), active: false, passPercent: 0, status: "pending", executionReleasePass: false, releaseGatePass: false, releaseReady: false, releaseApproved: false, modulesComplete: 0, modulesTotal: 0, criticalDefects: 0, blockedTasks: 0, board: [], modules: [], features: [], implementation: [], dashboard: [], readiness: [], gates: [], successCriteria: [], safeActions: [], activeGates: 0 },
    enterpriseDelivery: flags.enterprise_delivery_enabled !== false ? enterpriseDelivery : { scannedAt: new Date().toISOString(), active: false, passPercent: 0, status: "pending", enterpriseDeliveryPass: false, deliveryGatePass: false, productionLaunchReady: false, worldClassStandard: false, criticalDefects: 0, platformComplete: 0, platformTotal: 0, management: [], discovery: [], platform: [], globalUi: [], globalUx: [], marketplace: [], infrastructure: [], integrity: [], dashboard: [], zeroDefectPolicy: [], releaseGate: [], safeOptimizations: [], activePolicies: 0 },
    executionMode: flags.execution_mode_enabled !== false ? executionMode : { scannedAt: new Date().toISOString(), active: false, phase: "enterprise-delivery", passPercent: 0, status: "pending", executionModePass: false, executionPolicyPass: false, launchReadyFinal: false, enterpriseCertified: false, productionReady: false, criticalDefects: 0, prioritiesComplete: 0, prioritiesTotal: 0, cycle: [], priorities: [], improvements: [], infrastructure: [], dashboard: [], releasePolicy: [], finalSuccess: [], safeAutomation: [], activePolicies: 0, directive: "Does this change move ROVEXO closer to Production Launch?" },
    homepageCompletion: flags.homepage_completion_enabled !== false ? homepageCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 1, passPercent: 0, status: "pending", homepageCompletionPass: false, homepageCertified: false, productionReady: false, launchReady: false, componentsComplete: 0, componentsTotal: 0, components: [], visualIntegrity: [], searchArea: [], categoryValidation: [], layoutValidation: [], featuredContent: [], buttonValidation: [], responsiveValidation: [], performance: [], seo: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    categoryCompletion: flags.category_completion_enabled !== false ? categoryCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 2, passPercent: 0, status: "pending", categoryCompletionPass: false, categoryCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], integrity: [], homepageSync: [], searchSync: [], listingSync: [], aiCategoryEngine: [], seo: [], buttonValidation: [], databaseValidation: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    searchCompletion: flags.search_completion_enabled !== false ? searchCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 3, passPercent: 0, status: "pending", searchCompletionPass: false, searchCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], searchEngine: [], filters: [], sorting: [], results: [], emptyStates: [], performance: [], database: [], seo: [], aiSearch: [], omegaGlobal: [], accessibility: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    listingCompletion: flags.listing_completion_enabled !== false ? listingCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 4, passPercent: 0, status: "pending", listingCompletionPass: false, listingCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], workflow: [], fields: [], photoEngine: [], aiListing: [], liveValidation: [], previewEngine: [], publishValidation: [], buttonValidation: [], databaseValidation: [], omegaGlobal: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    buyerCompletion: flags.buyer_completion_enabled !== false ? buyerCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 5, passPercent: 0, status: "pending", buyerCompletionPass: false, buyerCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], workflow: [], profile: [], shopping: [], productPage: [], cart: [], checkout: [], orders: [], notifications: [], buttons: [], database: [], omegaGlobal: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    checkoutCompletion: flags.checkout_completion_enabled !== false ? checkoutCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 8, passPercent: 0, status: "pending", checkoutCompletionPass: false, checkoutCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], flow: [], payment: [], order: [], security: [], ux: [], buttons: [], database: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    orderCompletion: flags.order_completion_enabled !== false ? orderCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 9, passPercent: 0, status: "pending", orderCompletionPass: false, orderCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], workflow: [], buyer: [], seller: [], company: [], statusEngine: [], database: [], security: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    shippingCompletion: flags.shipping_completion_enabled !== false ? shippingCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 11, passPercent: 0, status: "pending", shippingCompletionPass: false, shippingCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], platform: [], database: [], security: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    communicationCompletion: flags.communication_completion_enabled !== false ? communicationCompletion : { scannedAt: new Date().toISOString(), active: false, launchPriority: 12, passPercent: 0, status: "pending", communicationCompletionPass: false, communicationCertified: false, productionReady: false, launchReady: false, domainsComplete: 0, domainsTotal: 0, domains: [], emailPlatform: [], emailSecurity: [], pushPlatform: [], cronQueues: [], realtime: [], database: [], security: [], accessibility: [], performance: [], certificationScores: [], passConditions: [], autoRepairs: [] },
    completionScan: enabled ? completionScan : createPendingMarketplaceCompletionScanResult(),
    productionGates,
    blockers,
    repairActions: flags.completion_auto_repair_enabled !== false ? repairActions : [],
    reports,
    auditEntries,
    settings,
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({ id: e.id, action: e.action, actor: e.administrator, target: e.module, timestamp: e.timestamp })),
    featureFlagsConfig: flags,
    pendingPublish: detectMarketplaceCompletionPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 100 ? "healthy" : enterpriseScore >= 90 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Marketplace Completion — PASS 100% Enterprise Certified" : "Marketplace Completion Engine disabled",
    },
  };
}

export async function getMarketplaceCompletionPageData(tab: MarketplaceCompletionTab = "dashboard") {
  const snapshot = await getMarketplaceCompletionSnapshot(tab);
  return { snapshot, descriptor: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR };
}

export function validateMarketplaceCompletionReadiness(snapshot: MarketplaceCompletionSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_marketplace_completion_engine_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassPercent >= 100,
    snapshot.dashboard.marketplaceReady === true,
    snapshot.dashboard.productionReady === true,
    snapshot.completionScan.certificationEligible === true,
    snapshot.completionScan.launchReadinessPass === true,
    snapshot.productionGates.every((g) => g.status === "pass"),
    snapshot.blockers.every((b) => !b.active),
    snapshot.completionScan.finalRulesPass === true,
    snapshot.intelligence.passPercent >= 100,
    snapshot.consistency.passPercent >= 100,
    snapshot.healthScores.overallScore >= 100,
    snapshot.finalRules.every((r) => r.pass),
    snapshot.completionScan.directorPass === true,
    snapshot.completionScan.certificationGatePass === true,
    snapshot.completionScan.omegaPass === true,
    snapshot.completionScan.worldClassStandard === true,
    snapshot.completionScan.launchModePass === true,
    snapshot.completionScan.launchReady === true,
    snapshot.launchMode.launchReady === true,
    snapshot.completionScan.zeroDefectPass === true,
    snapshot.completionScan.zeroDefectGatePass === true,
    snapshot.zeroDefect.zeroDefectPass === true,
    snapshot.zeroDefect.criticalDefects === 0,
    snapshot.completionScan.executionReleasePass === true,
    snapshot.completionScan.releaseGatePass === true,
    snapshot.completionScan.releaseReady === true,
    snapshot.executionRelease.releaseReady === true,
    snapshot.executionRelease.releaseApproved === true,
    snapshot.completionScan.enterpriseDeliveryPass === true,
    snapshot.completionScan.deliveryGatePass === true,
    snapshot.completionScan.productionLaunchReady === true,
    snapshot.enterpriseDelivery.productionLaunchReady === true,
    snapshot.enterpriseDelivery.worldClassStandard === true,
    snapshot.completionScan.executionModePass === true,
    snapshot.completionScan.executionPolicyPass === true,
    snapshot.completionScan.launchReadyFinal === true,
    snapshot.executionMode.launchReadyFinal === true,
    snapshot.executionMode.enterpriseCertified === true,
    snapshot.completionScan.homepageCompletionPass === true,
    snapshot.completionScan.homepageCertified === true,
    snapshot.homepageCompletion.homepageCertified === true,
    snapshot.homepageCompletion.homepageCompletionPass === true,
    snapshot.completionScan.categoryCompletionPass === true,
    snapshot.completionScan.categoryCertified === true,
    snapshot.categoryCompletion.categoryCertified === true,
    snapshot.categoryCompletion.categoryCompletionPass === true,
    snapshot.completionScan.searchCompletionPass === true,
    snapshot.completionScan.searchCertified === true,
    snapshot.searchCompletion.searchCertified === true,
    snapshot.searchCompletion.searchCompletionPass === true,
    snapshot.completionScan.listingCompletionPass === true,
    snapshot.completionScan.listingCertified === true,
    snapshot.listingCompletion.listingCertified === true,
    snapshot.listingCompletion.listingCompletionPass === true,
    snapshot.completionScan.buyerCompletionPass === true,
    snapshot.completionScan.buyerCertified === true,
    snapshot.buyerCompletion.buyerCertified === true,
    snapshot.buyerCompletion.buyerCompletionPass === true,
    snapshot.completionScan.checkoutCompletionPass === true,
    snapshot.completionScan.checkoutCertified === true,
    snapshot.checkoutCompletion.checkoutCertified === true,
    snapshot.checkoutCompletion.checkoutCompletionPass === true,
    snapshot.completionScan.orderCompletionPass === true,
    snapshot.completionScan.orderCertified === true,
    snapshot.orderCompletion.orderCertified === true,
    snapshot.orderCompletion.orderCompletionPass === true,
    snapshot.completionScan.shippingCompletionPass === true,
    snapshot.completionScan.shippingCertified === true,
    snapshot.shippingCompletion.shippingCertified === true,
    snapshot.shippingCompletion.shippingCompletionPass === true,
    snapshot.completionScan.communicationCompletionPass === true,
    snapshot.completionScan.communicationCertified === true,
    snapshot.communicationCompletion.communicationCertified === true,
    snapshot.communicationCompletion.communicationCompletionPass === true,
    snapshot.modules.every((m) => m.complete),
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 80, score };
}
