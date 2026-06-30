import type { DeploymentStrategy } from "@/lib/enterprise-deployment-center/types";
import { DEPLOYMENT_STRATEGIES } from "@/lib/enterprise-deployment-center/registry";

export function isValidStrategy(strategy: string): strategy is DeploymentStrategy {
  return (DEPLOYMENT_STRATEGIES as readonly string[]).includes(strategy);
}

export function listStrategies(): DeploymentStrategy[] {
  return [...DEPLOYMENT_STRATEGIES];
}

export function strategyRolloutPercent(strategy: DeploymentStrategy): number {
  const map: Record<DeploymentStrategy, number> = {
    standard: 100,
    "blue-green": 100,
    canary: 5,
    rolling: 25,
    "progressive-rollout": 10,
    "region-rollout": 20,
    "country-rollout": 15,
    "feature-rollout": 10,
  };
  return map[strategy];
}

export function isZeroDowntimeStrategy(strategy: DeploymentStrategy): boolean {
  return ["blue-green", "canary", "rolling"].includes(strategy);
}
