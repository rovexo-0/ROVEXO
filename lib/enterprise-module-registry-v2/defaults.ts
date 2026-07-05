import { discoverEnterpriseModulesV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import type { RegistryV2Document } from "@/lib/enterprise-module-registry-v2/types";

export function createDefaultRegistryV2Document(label: RegistryV2Document["label"] = "Live"): RegistryV2Document {
  return {
    label,
    version: "2.0.0",
    updatedAt: new Date().toISOString(),
    modules: discoverEnterpriseModulesV2(),
    featureFlagOverrides: {},
    globalFeatureFlags: { "registry-v2-enabled": true },
    disabledModules: [],
    auditLog: [],
    snapshots: [],
  };
}

export function normalizeRegistryDocument(doc: RegistryV2Document): RegistryV2Document {
  const defaults = createDefaultRegistryV2Document(doc.label);
  const discovered = discoverEnterpriseModulesV2();
  const persistedMap = new Map(doc.modules.map((m) => [m.moduleId, m]));
  const mergedModules = discovered.map((mod) => {
    const saved = persistedMap.get(mod.moduleId);
    if (!saved) return mod;
    return {
      ...mod,
      lifecycle: saved.lifecycle,
      health: saved.health,
      status: saved.status,
      priority: saved.priority,
      visibility: saved.visibility,
      updatedAt: saved.updatedAt,
    };
  });
  const discoveredIds = new Set(discovered.map((m) => m.moduleId));
  const customModules = doc.modules.filter((m) => !discoveredIds.has(m.moduleId));

  return {
    ...defaults,
    ...doc,
    modules: [...mergedModules, ...customModules],
    featureFlagOverrides: doc.featureFlagOverrides ?? {},
    globalFeatureFlags: doc.globalFeatureFlags ?? { "registry-v2-enabled": true },
    disabledModules: doc.disabledModules ?? [],
    auditLog: doc.auditLog ?? [],
    snapshots: doc.snapshots ?? [],
  };
}
