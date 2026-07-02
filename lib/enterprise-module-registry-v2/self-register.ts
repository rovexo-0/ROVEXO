import type { EnterpriseModuleV2Descriptor } from "@/lib/enterprise-module-registry-v2/types";

/** Enterprise surfaces that receive automatic module self-registration. */
export const ENTERPRISE_SELF_REGISTRATION_TARGETS = [
  "enterprise-registry",
  "mission-control",
  "enterprise-core",
  "global-navigation",
  "global-search",
  "permission-registry",
  "monitoring-registry",
  "audit-registry",
  "analytics-registry",
  "recovery-registry",
  "certification-registry",
  "developer-registry",
  "operations-registry",
  "settings-registry",
  "visual-cms-registry",
  "asset-registry",
  "platform-studio",
  "theme-studio-pro",
  "security-center",
  "analytics-center",
] as const;

export type EnterpriseSelfRegistrationTarget = (typeof ENTERPRISE_SELF_REGISTRATION_TARGETS)[number];

const TARGET_CATEGORY_MAP: Partial<Record<EnterpriseSelfRegistrationTarget, string[]>> = {
  "enterprise-registry": ["enterprise-core", "system"],
  "mission-control": ["mission-control", "operations", "enterprise-core"],
  "enterprise-core": ["enterprise-core", "core"],
  "global-navigation": [],
  "global-search": [],
  "permission-registry": [],
  "monitoring-registry": ["operations"],
  "audit-registry": ["audit"],
  "analytics-registry": ["analytics"],
  "recovery-registry": ["recovery"],
  "certification-registry": ["certification"],
  "developer-registry": ["developer"],
  "operations-registry": ["operations"],
  "settings-registry": ["enterprise-core", "platform-studio"],
  "visual-cms-registry": ["visual-cms"],
  "asset-registry": ["asset-manager"],
  "platform-studio": ["platform-studio"],
  "theme-studio-pro": ["theme-studio"],
  "security-center": ["security"],
  "analytics-center": ["analytics"],
};

export function getSelfRegistrationTargets(): EnterpriseSelfRegistrationTarget[] {
  return [...ENTERPRISE_SELF_REGISTRATION_TARGETS];
}

export function getModulesForRegistrationTarget(
  modules: EnterpriseModuleV2Descriptor[],
  target: EnterpriseSelfRegistrationTarget,
): EnterpriseModuleV2Descriptor[] {
  const categories = TARGET_CATEGORY_MAP[target];
  if (!categories || categories.length === 0) {
    return modules.filter((m) => m.autoRegister);
  }
  return modules.filter((m) => m.autoRegister && categories.includes(m.category));
}

export function buildSelfRegistrationManifest(modules: EnterpriseModuleV2Descriptor[]) {
  return ENTERPRISE_SELF_REGISTRATION_TARGETS.map((target) => ({
    target,
    moduleCount: getModulesForRegistrationTarget(modules, target).length,
    modules: getModulesForRegistrationTarget(modules, target).map((m) => m.moduleId),
  }));
}
