import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformDeploymentAction } from "@/lib/enterprise-deployment-center/audit";
import { getDeploymentLiveDocument, deploymentConfigLifecycle } from "@/lib/enterprise-deployment-center/config";
import { executeDeploymentConfigAction, isDeploymentConfigAction } from "@/lib/enterprise-deployment-center/config-actions";
import type { DeploymentConfigDocument } from "@/lib/enterprise-deployment-center/config";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import { createDeploymentBuild, runValidations } from "@/lib/enterprise-deployment-center/builds";
import { updateEnvironmentVersion } from "@/lib/enterprise-deployment-center/environments";
import {
  approveRelease,
  createRelease,
  isValidReleaseType,
  markDeployed,
  rejectRelease,
} from "@/lib/enterprise-deployment-center/releases";
import { emergencyRollback, rollbackRelease } from "@/lib/enterprise-deployment-center/rollback";
import { isValidStrategy } from "@/lib/enterprise-deployment-center/strategies";
import { advanceToCertification, advanceToManualApproval, advanceToValidation } from "@/lib/enterprise-deployment-center/workflow";
import { validateRelease } from "@/lib/enterprise-deployment-center/validation";
import { generateReleaseNotes } from "@/lib/enterprise-deployment-center/release-notes";
import { runPostDeployChecks, postDeployHealthScore } from "@/lib/enterprise-deployment-center/post-deploy";
import { generateDeploymentAiInsights } from "@/lib/enterprise-deployment-center/ai-integration";
import type { DeploymentEnvironment, DeploymentQueueItem } from "@/lib/enterprise-deployment-center/types";
import { isValidEnvironment } from "@/lib/enterprise-deployment-center/environments";

export async function executeDeploymentAction(
  action: string,
  actorId: string,
  payload?: Record<string, unknown>,
) {
  if (isDeploymentConfigAction(action)) {
    return executeDeploymentConfigAction(action, actorId, payload as { document?: DeploymentConfigDocument; historyId?: string });
  }

  const permission = canPerformDeploymentAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getDeploymentLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id,
    action,
  });

  switch (action) {
    case "build": {
      const version = String(payload?.version ?? live.settings.stagingVersion);
      const build = runValidations(createDeploymentBuild(version));
      const next = {
        ...live,
        settings: { ...live.settings, builds: [build, ...live.settings.builds].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { build };
    }
    case "validate": {
      const releaseId = String(payload?.releaseId ?? live.settings.releases[0]?.id ?? "");
      const release = live.settings.releases.find((r) => r.id === releaseId);
      if (!release) throw new Error("Release not found");
      const build = live.settings.builds[0];
      const result = validateRelease(release, build);
      let updated = advanceToValidation(release);
      if (result.passed) updated = advanceToManualApproval(advanceToCertification(advanceToValidation(release)));
      const releases = live.settings.releases.map((r) => (r.id === releaseId ? updated : r));
      const aiInsights = generateDeploymentAiInsights(releases, live.settings.builds);
      const next = {
        ...live,
        settings: { ...live.settings, releases, aiInsights },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { validation: result };
    }
    case "approve": {
      const releaseId = String(payload?.releaseId ?? "");
      const releases = live.settings.releases.map((r) =>
        r.id === releaseId ? approveRelease(r) : r,
      );
      const next = { ...live, settings: { ...live.settings, releases }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { release: releases.find((r) => r.id === releaseId) };
    }
    case "reject": {
      const releaseId = String(payload?.releaseId ?? "");
      const releases = live.settings.releases.map((r) =>
        r.id === releaseId ? rejectRelease(r) : r,
      );
      const next = { ...live, settings: { ...live.settings, releases }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { release: releases.find((r) => r.id === releaseId) };
    }
    case "deploy": {
      const releaseId = String(payload?.releaseId ?? live.settings.releases.find((r) => r.status === "approved")?.id ?? "");
      const strategy = String(payload?.strategy ?? live.settings.defaultStrategy);
      if (!isValidStrategy(strategy)) throw new Error("Invalid strategy");
      const release = live.settings.releases.find((r) => r.id === releaseId);
      if (!release) throw new Error("Release not found");

      const postDeploy = runPostDeployChecks();
      const health = postDeployHealthScore(postDeploy);
      if (health < 70 && live.featureFlags.auto_rollback_enabled !== false) {
        throw new Error("Post-deploy checks failed — deployment blocked");
      }

      const deployed = markDeployed({ ...release, strategy: strategy as typeof release.strategy, status: "deploying" });
      const releases = live.settings.releases.map((r) => (r.id === releaseId ? markDeployed(deployed) : r));
      const environments = updateEnvironmentVersion(live.settings.environments, release.environment, release.version);
      const queueItem: DeploymentQueueItem = {
        id: `q-${Date.now()}`,
        releaseId,
        version: release.version,
        environment: release.environment,
        strategy: strategy as DeploymentQueueItem["strategy"],
        status: "completed",
        stage: "completed",
        createdAt: new Date().toISOString(),
      };
      const notes = generateReleaseNotes(release.version);
      const next = {
        ...live,
        settings: {
          ...live.settings,
          releases,
          environments,
          queue: live.settings.queue.filter((q) => q.releaseId !== releaseId),
          deploymentHistory: [queueItem, ...live.settings.deploymentHistory].slice(0, 100),
          releaseNotes: [notes, ...live.settings.releaseNotes].slice(0, 20),
        },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { release: markDeployed(deployed), postDeploy, health };
    }
    case "rollback": {
      const releaseId = String(payload?.releaseId ?? live.settings.releases.find((r) => r.status === "deployed")?.id ?? "");
      const emergency = Boolean(payload?.emergency);
      const releases = live.settings.releases.map((r) =>
        r.id === releaseId ? (emergency ? emergencyRollback(r) : rollbackRelease(r)) : r,
      );
      const next = { ...live, settings: { ...live.settings, releases }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { release: releases.find((r) => r.id === releaseId) };
    }
    case "cancel": {
      const queueId = String(payload?.queueId ?? "");
      const queue = live.settings.queue.map((q) =>
        q.id === queueId ? { ...q, status: "cancelled" as const } : q,
      );
      const next = { ...live, settings: { ...live.settings, queue }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { queue: queue.find((q) => q.id === queueId) };
    }
    case "create-release": {
      const type = String(payload?.releaseType ?? "release-candidate");
      const version = String(payload?.version ?? live.settings.stagingVersion);
      const env = String(payload?.environment ?? "staging");
      if (!isValidReleaseType(type)) throw new Error("Invalid release type");
      if (!isValidEnvironment(env)) throw new Error("Invalid environment");
      const release = createRelease(type, version, env as DeploymentEnvironment);
      const next = {
        ...live,
        settings: { ...live.settings, releases: [release, ...live.settings.releases].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await deploymentConfigLifecycle.saveDraft(next, actorId);
      return { release };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
