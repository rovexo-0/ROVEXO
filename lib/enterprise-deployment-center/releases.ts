import type { DeploymentEnvironment, DeploymentStrategy, PlatformRelease, ReleaseType, WorkflowStage } from "@/lib/enterprise-deployment-center/types";
import { RELEASE_TYPES, WORKFLOW_STAGES } from "@/lib/enterprise-deployment-center/registry";

export function isValidReleaseType(type: string): type is ReleaseType {
  return (RELEASE_TYPES as readonly string[]).includes(type);
}

export function isValidWorkflowStage(stage: string): stage is WorkflowStage {
  return (WORKFLOW_STAGES as readonly string[]).includes(stage);
}

export function createRelease(
  type: ReleaseType,
  version: string,
  environment: DeploymentEnvironment = "staging",
  strategy: DeploymentStrategy = "standard",
): PlatformRelease {
  return {
    id: `rel-${Date.now()}`,
    type,
    version,
    environment,
    status: "draft",
    strategy,
    stage: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function advanceWorkflowStage(release: PlatformRelease): PlatformRelease {
  const idx = WORKFLOW_STAGES.indexOf(release.stage);
  const next = WORKFLOW_STAGES[Math.min(idx + 1, WORKFLOW_STAGES.length - 1)]!;
  return { ...release, stage: next };
}

export function approveRelease(release: PlatformRelease): PlatformRelease {
  return { ...release, status: "approved", stage: "deployment" };
}

export function rejectRelease(release: PlatformRelease): PlatformRelease {
  return { ...release, status: "failed", stage: "draft" };
}

export function markDeployed(release: PlatformRelease): PlatformRelease {
  return {
    ...release,
    status: "deployed",
    stage: "completed",
    deployedAt: new Date().toISOString(),
  };
}

export function pendingApprovals(releases: PlatformRelease[]): PlatformRelease[] {
  return releases.filter((r) => r.status === "pending-approval");
}

export function activeReleases(releases: PlatformRelease[]): PlatformRelease[] {
  return releases.filter((r) => r.status === "deploying" || r.status === "deployed");
}

export function failedReleases(releases: PlatformRelease[]): PlatformRelease[] {
  return releases.filter((r) => r.status === "failed");
}
