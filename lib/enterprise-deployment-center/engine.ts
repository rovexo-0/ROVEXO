import type { DeploymentDashboard, DeploymentSettings, DeploymentState } from "@/lib/enterprise-deployment-center/types";
import { createDefaultEnvironments } from "@/lib/enterprise-deployment-center/environments";
import { createRelease, pendingApprovals, activeReleases, failedReleases } from "@/lib/enterprise-deployment-center/releases";
import { createDeploymentBuild, runValidations } from "@/lib/enterprise-deployment-center/builds";
import { createDefaultFeatureFlags } from "@/lib/enterprise-deployment-center/feature-flags";
import { generateReleaseNotes } from "@/lib/enterprise-deployment-center/release-notes";
import { generateDeploymentAiInsights } from "@/lib/enterprise-deployment-center/ai-integration";
import { isRollbackAvailable } from "@/lib/enterprise-deployment-center/rollback";
import { postDeployHealthScore, runPostDeployChecks } from "@/lib/enterprise-deployment-center/post-deploy";

export function createDefaultDeploymentSettings(): DeploymentSettings {
  return {
    productionVersion: "2.5.0",
    stagingVersion: "2.5.0-rc.1",
    developmentVersion: "2.5.0-dev",
    approvalRequired: true,
    certificationRequired: true,
    aiAnalysisRequired: true,
    defaultStrategy: "canary",
  };
}

export function createDefaultDeploymentState(): DeploymentState {
  const environments = createDefaultEnvironments();
  const builds = [runValidations(createDeploymentBuild("2.5.0-rc.1"))];
  const releases = [
    createRelease("release-candidate", "2.5.0-rc.1", "staging", "canary"),
    createRelease("public-release", "2.5.0", "production", "blue-green"),
  ];
  releases[0]!.status = "pending-approval";
  releases[0]!.stage = "manual-approval";
  releases[1]!.status = "deployed";
  releases[1]!.stage = "completed";
  releases[1]!.deployedAt = new Date().toISOString();

  const queue = [
    {
      id: "q-1",
      releaseId: releases[0]!.id,
      version: "2.5.0-rc.1",
      environment: "staging" as const,
      strategy: "canary" as const,
      status: "queued" as const,
      stage: "manual-approval" as const,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    environments,
    releases,
    builds,
    queue,
    featureFlags: createDefaultFeatureFlags(),
    releaseNotes: [generateReleaseNotes("2.5.0")],
    aiInsights: generateDeploymentAiInsights(releases, builds),
    deploymentHistory: [
      { ...queue[0]!, id: "hist-1", status: "completed" as const, stage: "completed" as const },
    ],
  };
}

export function buildDeploymentDashboard(state: DeploymentState, settings: DeploymentSettings): DeploymentDashboard {
  const postDeploy = postDeployHealthScore(runPostDeployChecks());
  const prod = state.environments.find((e) => e.id === "production");
  const staging = state.environments.find((e) => e.id === "staging");
  const dev = state.environments.find((e) => e.id === "development");
  const lastHist = state.deploymentHistory[0];

  return {
    productionVersion: prod?.version ?? settings.productionVersion,
    stagingVersion: staging?.version ?? settings.stagingVersion,
    developmentVersion: dev?.version ?? settings.developmentVersion,
    lastDeployment: lastHist?.createdAt ?? new Date().toISOString(),
    queueLength: state.queue.filter((q) => q.status === "queued" || q.status === "running").length,
    deploymentHealth: postDeploy,
    buildStatus: state.builds[0]?.status === "failed" ? "failed" : state.builds[0]?.status === "building" ? "building" : "healthy",
    certificationStatus: postDeploy >= 90 ? "certified" : postDeploy >= 70 ? "pending" : "failed",
    rollbackAvailable: isRollbackAvailable(state.deploymentHistory),
    activeReleases: activeReleases(state.releases).length,
    pendingApprovals: pendingApprovals(state.releases).length,
    failedDeployments: failedReleases(state.releases).length,
  };
}
