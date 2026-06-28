import type { DeploymentEnvironment, DeploymentQueueItem, PlatformRelease } from "@/lib/enterprise-deployment-center/types";

export function createRollbackPlan(release: PlatformRelease, type: "one-click" | "version" | "environment" | "emergency" | "ai-recommended" = "one-click") {
  return {
    id: `rollback-${Date.now()}`,
    releaseId: release.id,
    version: release.version,
    environment: release.environment,
    type,
    status: "pending-approval" as const,
    createdAt: new Date().toISOString(),
  };
}

export function rollbackRelease(release: PlatformRelease): PlatformRelease {
  return { ...release, status: "rolled-back", stage: "completed" };
}

export function rollbackEnvironment(
  environment: DeploymentEnvironment,
  previousVersion: string,
): { environment: DeploymentEnvironment; version: string } {
  return { environment, version: previousVersion };
}

export function isRollbackAvailable(history: DeploymentQueueItem[]): boolean {
  return history.some((h) => h.status === "completed");
}

export function emergencyRollback(release: PlatformRelease): PlatformRelease {
  return { ...release, status: "rolled-back", stage: "completed" };
}
