import type { DeploymentFeatureFlag, FeatureFlagRule } from "@/lib/enterprise-deployment-center/types";
import { FEATURE_FLAG_RULES } from "@/lib/enterprise-deployment-center/registry";

export function createDefaultFeatureFlags(): DeploymentFeatureFlag[] {
  return [
    { id: "ff-1", key: "deployment_center_enabled", enabled: true, percentage: 100, rules: [] },
    { id: "ff-2", key: "canary_deployments", enabled: true, percentage: 25, rules: ["percentage-rollout"] },
    { id: "ff-3", key: "beta_features", enabled: false, percentage: 0, rules: ["business-rules"] },
  ];
}

export function toggleFeatureFlag(flag: DeploymentFeatureFlag, enabled: boolean): DeploymentFeatureFlag {
  return { ...flag, enabled, percentage: enabled ? flag.percentage || 100 : 0 };
}

export function setRolloutPercentage(flag: DeploymentFeatureFlag, percentage: number): DeploymentFeatureFlag {
  return { ...flag, percentage: Math.max(0, Math.min(100, percentage)), rules: [...new Set([...flag.rules, "percentage-rollout" as FeatureFlagRule])] };
}

export function isValidFeatureFlagRule(rule: string): rule is FeatureFlagRule {
  return (FEATURE_FLAG_RULES as readonly string[]).includes(rule);
}

export function applyFeatureFlagRules(flag: DeploymentFeatureFlag, rules: FeatureFlagRule[]): DeploymentFeatureFlag {
  return { ...flag, rules };
}
