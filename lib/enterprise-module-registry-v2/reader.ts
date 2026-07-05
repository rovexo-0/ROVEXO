import { buildDependencyGraph, computeDependencyHealth } from "@/lib/enterprise-module-registry-v2/dependencies";
import {
  applyHealthToModules,
  buildDashboardMetrics,
  buildFeatureFlagStates,
} from "@/lib/enterprise-module-registry-v2/health";
import { getRegistryDraft, getRegistryHistory, readLiveRegistryDocument } from "@/lib/enterprise-module-registry-v2/engine";
import { getSelfRegistrationTargets } from "@/lib/enterprise-module-registry-v2/self-register";
import { validateRegistryModules } from "@/lib/enterprise-module-registry-v2/validation";
import { buildVersionMatrix, detectPendingPublish } from "@/lib/enterprise-module-registry-v2/versioning";
import type { ModuleRegistryV2Snapshot, ModuleRegistryV2Tab } from "@/lib/enterprise-module-registry-v2/types";

export async function getModuleRegistryV2Snapshot(_tab?: ModuleRegistryV2Tab): Promise<ModuleRegistryV2Snapshot> {
  void _tab;
  const [draft, live, history] = await Promise.all([
    getRegistryDraft(),
    readLiveRegistryDocument(),
    getRegistryHistory(),
  ]);

  const modules = applyHealthToModules(live.modules, live.disabledModules);
  const validation = validateRegistryModules(modules);
  const dependencyGraph = buildDependencyGraph(modules);
  const dependencyHealth = computeDependencyHealth(dependencyGraph);
  const pendingPublish = detectPendingPublish(draft, live);
  const pendingRollback = history.find((h) => h.rollbackAvailable)?.id ?? null;

  const dashboard = buildDashboardMetrics(
    modules,
    pendingPublish,
    pendingRollback,
    validation.overallScore,
    dependencyHealth,
  );  const featureFlags = buildFeatureFlagStates(modules, live.featureFlagOverrides);
  const versionMatrix = buildVersionMatrix(modules);

  const auditHistory = [
    ...live.auditLog,
    ...history.flatMap((h) => h.bundle.auditLog),
  ].slice(0, 50);

  return {
    scannedAt: new Date().toISOString(),
    dashboard,
    modules,
    dependencyGraph,
    validation,
    featureFlags,
    versionMatrix,
    history: auditHistory,
    selfRegistrationTargets: getSelfRegistrationTargets(),
    pendingPublish,
    pendingRollback,
    draft,
    live,
  };
}

export async function getModuleRegistryPageData(_tab: ModuleRegistryV2Tab = "dashboard") {
  void _tab;
  const snapshot = await getModuleRegistryV2Snapshot();
  return { snapshot };
}
