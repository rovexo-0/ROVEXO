import type {
  EnterpriseModuleV2Descriptor,
  ModuleHealthLevel,
  RegistryDashboardMetrics,
  RegistryFeatureFlagState,
} from "@/lib/enterprise-module-registry-v2/types";

export function computeModuleHealth(module: EnterpriseModuleV2Descriptor, disabled: boolean): ModuleHealthLevel {
  if (disabled || module.lifecycle === "disabled" || module.lifecycle === "failed") return "failed";
  if (module.lifecycle === "maintenance" || module.lifecycle === "recovery") return "warning";
  if (module.lifecycle === "deprecated" || module.lifecycle === "archived") return "warning";
  if (module.health === "critical") return "critical";
  if (module.health === "warning") return "warning";
  return "healthy";
}

export function applyHealthToModules(
  modules: EnterpriseModuleV2Descriptor[],
  disabledModules: string[],
): EnterpriseModuleV2Descriptor[] {
  return modules.map((module) => ({
    ...module,
    health: computeModuleHealth(module, disabledModules.includes(module.moduleId)),
    lifecycle: disabledModules.includes(module.moduleId) ? "disabled" : module.lifecycle,
  }));
}

export function buildDashboardMetrics(
  modules: EnterpriseModuleV2Descriptor[],
  pendingPublish: boolean,
  pendingRollback: string | null,
  validationScore: number,
  dependencyHealth = validationScore,
): RegistryDashboardMetrics {
  const healthy = modules.filter((m) => m.health === "healthy").length;
  const warning = modules.filter((m) => m.health === "warning").length;
  const critical = modules.filter((m) => m.health === "critical").length;
  const failed = modules.filter((m) => m.health === "failed").length;
  const disabled = modules.filter((m) => m.lifecycle === "disabled").length;
  const healthScore = modules.length === 0 ? 0 : Math.round((healthy / modules.length) * 100);
  const enterpriseScore = Math.round((validationScore + healthScore) / 2);

  return {
    registeredModules: modules.length,
    healthyModules: healthy,
    warningModules: warning,
    criticalModules: critical,
    failedModules: failed,
    disabledModules: disabled,
    updatesAvailable: modules.filter((m) => m.status === "beta" || m.lifecycle === "updating").length,
    pendingPublish: pendingPublish ? 1 : 0,
    pendingRollback: pendingRollback ? 1 : 0,
    healthScore,
    registryHealth: healthScore,
    dependencyHealth,
    enterpriseScore,
    architectureCompliance: validationScore,
  };
}

export function buildFeatureFlagStates(
  modules: EnterpriseModuleV2Descriptor[],
  overrides: Record<string, Record<string, boolean>>,
): RegistryFeatureFlagState[] {
  const states: RegistryFeatureFlagState[] = [];
  for (const module of modules) {
    for (const flag of module.featureFlags) {
      const override = overrides[module.moduleId]?.[flag.id];
      states.push({
        moduleId: module.moduleId,
        flagId: flag.id,
        enabled: flag.emergencyKillSwitch ? false : override ?? flag.defaultEnabled,
        source: flag.emergencyKillSwitch
          ? "kill-switch"
          : override !== undefined
            ? "override"
            : "default",
      });
    }
  }
  return states;
}
