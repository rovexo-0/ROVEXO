import type { DeploymentSnapshot, DeploymentTab } from "@/lib/enterprise-deployment-center/types";
import {
  detectDeploymentPendingPublish,
  getDeploymentDraftDocument,
  getDeploymentLiveDocument,
  deploymentConfigLifecycle,
} from "@/lib/enterprise-deployment-center/config";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import { buildDeploymentDashboard } from "@/lib/enterprise-deployment-center/engine";
import { isLiveDeploymentAllowed } from "@/lib/full-demo/deploy-gate";

export async function getDeploymentSnapshot(tab: DeploymentTab = "dashboard"): Promise<DeploymentSnapshot> {
  const live = await getDeploymentLiveDocument();
  const draft = await getDeploymentDraftDocument();
  const {
    environments, releases, builds, queue, featureFlags, releaseNotes,
    aiInsights,
  } = live.settings;
  const settings = Object.fromEntries(
    Object.entries(live.settings).filter(
      ([key]) =>
        ![
          "environments",
          "releases",
          "builds",
          "queue",
          "featureFlags",
          "releaseNotes",
          "aiInsights",
          "deploymentHistory",
        ].includes(key),
    ),
  ) as Omit<
    typeof live.settings,
    | "environments"
    | "releases"
    | "builds"
    | "queue"
    | "featureFlags"
    | "releaseNotes"
    | "aiInsights"
    | "deploymentHistory"
  >;
  const flags = live.featureFlags;
  const enabled = flags.deployment_center_enabled !== false;
  const dashboard = buildDeploymentDashboard(live.settings, settings);
  const history = await deploymentConfigLifecycle.getHistory();
  const healthScore = enabled ? dashboard.deploymentHealth : 0;

  return {
    tab,
    dashboard,
    environments,
    releases,
    builds,
    queue,
    featureFlags,
    releaseNotes,
    aiInsights: flags.ai_validation_enabled !== false ? aiInsights : [],
    history: history.map((h) => ({
      id: h.id,
      action: "publish",
      actor: h.publishedBy,
      timestamp: h.publishedAt,
    })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectDeploymentPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Deployment Center operational" : "Deployment Center disabled",
    },
  };
}

export async function getDeploymentPageData(tab: DeploymentTab = "dashboard") {
  const snapshot = await getDeploymentSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR };
}

export function validateDeploymentReadiness(snapshot: DeploymentSnapshot): { ready: boolean; score: number } {
  const fullDemoOk = isLiveDeploymentAllowed();
  const checks = [
    snapshot.featureFlagsConfig.deployment_center_enabled !== false,
    snapshot.environments.length > 0,
    snapshot.health.score === 100,
    fullDemoOk,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score === 100 && checks.every(Boolean), score };
}
