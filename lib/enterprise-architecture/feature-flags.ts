import type { EnterpriseFeatureFlag, EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";

export function createDefaultFeatureFlags(
  flags: readonly EnterpriseFeatureFlag[],
): Record<string, boolean> {
  return Object.fromEntries(flags.map((flag) => [flag.id, flag.defaultEnabled]));
}

export function isFeatureEnabled(
  moduleId: string,
  flagId: string,
  liveFlags: Record<string, boolean> | undefined,
): boolean {
  const descriptor = getEnterpriseModuleDescriptor(moduleId);
  if (!descriptor) return false;

  const definition = descriptor.featureFlags.find((flag) => flag.id === flagId);
  if (!definition) return false;

  if (liveFlags && flagId in liveFlags) return liveFlags[flagId]!;
  return definition.defaultEnabled;
}

export function mergeFeatureFlags(
  descriptor: EnterpriseModuleDescriptor,
  overrides: Record<string, boolean> | undefined,
): Record<string, boolean> {
  return {
    ...createDefaultFeatureFlags(descriptor.featureFlags),
    ...overrides,
  };
}
