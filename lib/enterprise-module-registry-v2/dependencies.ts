import type {
  DependencyGraphAnalysis,
  DependencyGraphNode,
  EnterpriseModuleV2Descriptor,
  HealthDependencyChainEntry,
  ModuleHealthLevel,
} from "@/lib/enterprise-module-registry-v2/types";

function detectCycles(nodes: DependencyGraphNode[]): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const adjacency = new Map(nodes.map((n) => [n.moduleId, n.dependencies]));

  function dfs(nodeId: string, path: string[]) {
    if (visiting.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      if (cycleStart >= 0) cycles.push(path.slice(cycleStart).concat(nodeId));
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const dep of adjacency.get(nodeId) ?? []) {
      dfs(dep, [...path, nodeId]);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of nodes) dfs(node.moduleId, []);
  return cycles;
}

function buildHealthChain(
  moduleId: string,
  modules: Map<string, EnterpriseModuleV2Descriptor>,
  visited = new Set<string>(),
): HealthDependencyChainEntry {
  if (visited.has(moduleId)) {
    return { moduleId, chain: [moduleId], health: "warning" };
  }
  visited.add(moduleId);
  const module = modules.get(moduleId);
  if (!module) return { moduleId, chain: [moduleId], health: "failed" };

  const chain = [moduleId, ...module.dependencies];
  const depHealths = module.dependencies.map((dep) => modules.get(dep)?.health ?? "unknown");
  const health: ModuleHealthLevel = depHealths.includes("failed")
    ? "failed"
    : depHealths.includes("critical")
      ? "critical"
      : depHealths.includes("warning")
        ? "warning"
        : module.health;

  return { moduleId, chain, health };
}

export function buildDependencyGraph(modules: EnterpriseModuleV2Descriptor[]): DependencyGraphAnalysis {
  const moduleIds = new Set(modules.map((m) => m.moduleId));
  const moduleMap = new Map(modules.map((m) => [m.moduleId, m]));

  const nodes: DependencyGraphNode[] = modules.map((module) => ({
    moduleId: module.moduleId,
    moduleName: module.moduleName,
    category: module.category,
    version: module.version,
    dependencies: module.dependencies,
    dependents: modules
      .filter((other) => other.dependencies.includes(module.moduleId))
      .map((other) => other.moduleId),
  }));

  const edges = modules.flatMap((module) =>
    module.dependencies.map((dep) => ({ from: module.moduleId, to: dep })),
  );

  const parentModules: Record<string, string[]> = {};
  const childModules: Record<string, string[]> = {};
  for (const node of nodes) {
    parentModules[node.moduleId] = node.dependencies;
    childModules[node.moduleId] = node.dependents;
  }

  const missingDependencies = modules.flatMap((module) =>
    module.dependencies
      .filter((dep) => !moduleIds.has(dep))
      .map((missing) => ({ moduleId: module.moduleId, missing })),
  );

  const idCounts = new Map<string, number>();
  for (const module of modules) {
    idCounts.set(module.moduleId, (idCounts.get(module.moduleId) ?? 0) + 1);
  }
  const duplicateModules = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  const unusedModules = modules
    .filter(
      (module) =>
        !edges.some((e) => e.to === module.moduleId) &&
        module.dependencies.length === 0 &&
        module.moduleId !== "enterprise-core" &&
        module.moduleId !== "enterprise-module-registry-v2",
    )
    .map((m) => m.moduleId);

  const versionConflicts: DependencyGraphAnalysis["versionConflicts"] = [];
  for (const module of modules) {
    for (const depId of module.dependencies) {
      const dep = modules.find((m) => m.moduleId === depId);
      if (dep && dep.compatibilityVersion !== module.compatibilityVersion && dep.category !== module.category) {
        versionConflicts.push({
          moduleId: module.moduleId,
          dependency: depId,
          expected: module.compatibilityVersion,
          actual: dep.compatibilityVersion,
        });
      }
    }
  }

  const healthDependencyChain = modules
    .filter((m) => m.dependencies.length > 0)
    .slice(0, 50)
    .map((m) => buildHealthChain(m.moduleId, moduleMap));

  return {
    nodes,
    edges,
    parentModules,
    childModules,
    circularDependencies: detectCycles(nodes),
    unusedModules,
    missingDependencies,
    duplicateModules,
    versionConflicts,
    healthDependencyChain,
  };
}

export function computeDependencyHealth(graph: DependencyGraphAnalysis): number {
  const issues =
    graph.circularDependencies.length +
    graph.missingDependencies.length +
    graph.duplicateModules.length +
    graph.versionConflicts.length;
  if (graph.nodes.length === 0) return 100;
  return Math.max(0, Math.round(100 - (issues / graph.nodes.length) * 100));
}
