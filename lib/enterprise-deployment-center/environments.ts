import type { DeploymentEnvironment, DeploymentEnvironmentState } from "@/lib/enterprise-deployment-center/types";
import { DEPLOYMENT_ENVIRONMENTS } from "@/lib/enterprise-deployment-center/registry";

const LABELS: Record<DeploymentEnvironment, string> = {
  development: "Development",
  qa: "QA",
  staging: "Staging",
  uat: "UAT",
  production: "Production",
  "disaster-recovery": "Disaster Recovery",
  sandbox: "Sandbox",
};

export function createDefaultEnvironments(): DeploymentEnvironmentState[] {
  const now = new Date().toISOString();
  return DEPLOYMENT_ENVIRONMENTS.map((id, i) => ({
    id,
    label: LABELS[id],
    version: id === "production" ? "2.5.0" : id === "staging" ? "2.5.0-rc.1" : "2.5.0-dev",
    status: i === 6 ? "offline" as const : "healthy" as const,
    lastDeployedAt: id !== "sandbox" ? now : undefined,
  }));
}

export function isValidEnvironment(env: string): env is DeploymentEnvironment {
  return (DEPLOYMENT_ENVIRONMENTS as readonly string[]).includes(env);
}

export function getEnvironment(envs: DeploymentEnvironmentState[], id: DeploymentEnvironment) {
  return envs.find((e) => e.id === id);
}

export function updateEnvironmentVersion(
  envs: DeploymentEnvironmentState[],
  id: DeploymentEnvironment,
  version: string,
): DeploymentEnvironmentState[] {
  return envs.map((e) =>
    e.id === id ? { ...e, version, lastDeployedAt: new Date().toISOString(), status: "healthy" as const } : e,
  );
}
