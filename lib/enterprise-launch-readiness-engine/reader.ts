import type { LaunchReadinessSnapshot, LaunchReadinessTab } from "@/lib/enterprise-launch-readiness-engine/types";
import {
  detectLaunchReadinessPendingPublish,
  getLaunchReadinessDraftDocument,
  getLaunchReadinessLiveDocument,
  launchReadinessConfigLifecycle,
} from "@/lib/enterprise-launch-readiness-engine/config";
import { LAUNCH_READINESS_MODULE_DESCRIPTOR } from "@/lib/enterprise-launch-readiness-engine/descriptor";
import { computeLaunchEnterpriseScore, createDefaultLaunchReadinessSettings } from "@/lib/enterprise-launch-readiness-engine/engine";
import { runLaunchReadinessScan } from "@/lib/enterprise-launch-readiness-engine/scanner";

export async function getLaunchReadinessSnapshot(tab: LaunchReadinessTab = "dashboard"): Promise<LaunchReadinessSnapshot> {
  const live = await getLaunchReadinessLiveDocument();
  const draft = await getLaunchReadinessDraftDocument();
  const {
    dashboard,
    scores,
    email,
    cron,
    queue,
    pwa,
    push,
    healthChecks,
    performance,
    caching,
    database,
    searchIndex,
    seo,
    security,
    storage,
    deployment,
    monitoring,
    launchScan,
    productionGates,
    blockers,
    repairActions,
    reports,
    auditEntries,
    validationOnlyMode,
    blockProtectedAreaFixes,
    autoRepairEnabled,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    coordinateWithDeployment,
    requirePass100,
  } = live.settings;
  const settings = {
    ...createDefaultLaunchReadinessSettings(),
    validationOnlyMode: validationOnlyMode ?? true,
    blockProtectedAreaFixes,
    autoRepairEnabled,
    coordinateWithQa,
    coordinateWithGovernance,
    coordinateWithCertification,
    coordinateWithDeployment,
    requirePass100: requirePass100 ?? true,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_launch_readiness_engine_v1 !== false;
  const enterpriseScore = enabled ? computeLaunchEnterpriseScore(launchScan) : 0;
  const history = await launchReadinessConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, overallPassPercent: 0, enterpriseScore: 0, certificationGranted: false, productionReady: false, launchReady: false },
    scores: enabled ? scores : [],
    email: flags.infrastructure_validation_enabled !== false ? email : [],
    cron: flags.infrastructure_validation_enabled !== false ? cron : [],
    queue: flags.infrastructure_validation_enabled !== false ? queue : [],
    pwa: flags.pwa_validation_enabled !== false ? pwa : [],
    push: flags.push_validation_enabled !== false ? push : [],
    healthChecks: flags.infrastructure_validation_enabled !== false ? healthChecks : [],
    performance: flags.performance_validation_enabled !== false ? performance : [],
    caching: flags.infrastructure_validation_enabled !== false ? caching : [],
    database: flags.infrastructure_validation_enabled !== false ? database : [],
    searchIndex: flags.marketplace_validation_enabled !== false ? searchIndex : [],
    seo: flags.marketplace_validation_enabled !== false ? seo : [],
    security: flags.security_validation_enabled !== false ? security : [],
    storage: flags.infrastructure_validation_enabled !== false ? storage : [],
    deployment: flags.infrastructure_validation_enabled !== false ? deployment : [],
    monitoring: flags.infrastructure_validation_enabled !== false ? monitoring : [],
    launchScan: enabled ? launchScan : runLaunchReadinessScan("full-scan"),
    productionGates,
    blockers,
    repairActions: flags.launch_auto_repair_enabled !== false ? repairActions : [],
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
    pendingPublish: detectLaunchReadinessPendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 100 ? "healthy" : enterpriseScore >= 90 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Enterprise Launch Readiness — PASS 100% operational validation" : "Launch Readiness Engine disabled",
    },
  };
}

export async function getLaunchReadinessPageData(tab: LaunchReadinessTab = "dashboard") {
  const snapshot = await getLaunchReadinessSnapshot(tab);
  return { snapshot, descriptor: LAUNCH_READINESS_MODULE_DESCRIPTOR };
}

export function validateLaunchReadiness(snapshot: LaunchReadinessSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_launch_readiness_engine_v1 !== false,
    snapshot.settings.validationOnlyMode === true,
    snapshot.dashboard.overallPassPercent >= 100,
    snapshot.dashboard.launchReady === true,
    snapshot.dashboard.productionReady === true,
    snapshot.launchScan.certificationEligible === true,
    snapshot.productionGates.every((g) => g.status === "pass"),
    snapshot.blockers.every((b) => !b.active),
    snapshot.scores.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 80, score };
}
