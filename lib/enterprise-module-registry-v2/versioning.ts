import type {
  EnterpriseModuleV2Descriptor,
  RegistryVersionEntry,
  RegistryV2Document,
} from "@/lib/enterprise-module-registry-v2/types";

export function parseSemver(version: string): { major: number; minor: number; patch: number } {
  const [major = "0", minor = "0", patch = "0"] = version.split(".");
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

export function isCompatibleVersion(moduleVersion: string, required: string): boolean {
  const mod = parseSemver(moduleVersion);
  const req = parseSemver(required);
  return mod.major === req.major && mod.minor >= req.minor;
}

export function buildVersionMatrix(modules: EnterpriseModuleV2Descriptor[]): RegistryVersionEntry[] {
  return modules.map((module) => ({
    id: `ver-${module.moduleId}`,
    moduleId: module.moduleId,
    version: module.version,
    compatibilityVersion: module.compatibilityVersion,
    publishedAt: module.updatedAt,
    publishedBy: module.owner,
    releaseNotes: `${module.moduleName} v${module.version}`,
    rollbackAvailable: true,
  }));
}

export function detectPendingPublish(draft: RegistryV2Document, live: RegistryV2Document): boolean {
  return draft.version !== live.version || draft.updatedAt !== live.updatedAt;
}

export function mergeDiscoveredModules(
  discovered: EnterpriseModuleV2Descriptor[],
  persisted: EnterpriseModuleV2Descriptor[],
): EnterpriseModuleV2Descriptor[] {
  const persistedMap = new Map(persisted.map((m) => [m.moduleId, m]));
  return discovered.map((module) => {
    const saved = persistedMap.get(module.moduleId);
    if (!saved) return module;
    return {
      ...module,
      lifecycle: saved.lifecycle,
      health: saved.health,
      status: saved.status,
      priority: saved.priority,
      visibility: saved.visibility,
      updatedAt: saved.updatedAt,
    };
  });
}
