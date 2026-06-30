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
  const enterpriseModule = modules.get(moduleId);
  if (!enterpriseModule) return { moduleId, chain: [moduleId], health: "failed" };

  const chain = [moduleId, ...enterpriseModule.dependencies];
  const depHealths = enterpriseModule.dependencies.map((dep) => modules.get(dep)?.health ?? "unknown");
  const health: ModuleHealthLevel = depHealths.includes("failed")
    ? "failed"
    : depHealths.includes("critical")
      ? "critical"
      : depHealths.includes("warning")
        ? "warning"
        : enterpriseModule.health;

  return { moduleId, chain, health };
}

export function buildDependencyGraph(modules: EnterpriseModuleV2Descriptor[]): DependencyGraphAnalysis {
  const moduleIds = new Set(modules.map((m) => m.moduleId));
  const moduleMap = new Map(modules.map((m) => [m.moduleId, m]));

  const nodes: DependencyGraphNode[] = modules.map((enterpriseModule) => ({
    moduleId: enterpriseModule.moduleId,
    moduleName: enterpriseModule.moduleName,
    category: enterpriseModule.category,
    version: enterpriseModule.version,
    dependencies: enterpriseModule.dependencies,
    dependents: modules
      .filter((other) => other.dependencies.includes(enterpriseModule.moduleId))
      .map((other) => other.moduleId),
  }));

  const edges = modules.flatMap((enterpriseModule) =>
    enterpriseModule.dependencies.map((dep) => ({ from: enterpriseModule.moduleId, to: dep })),
  );

  const parentModules: Record<string, string[]> = {};
  const childModules: Record<string, string[]> = {};
  for (const node of nodes) {
    parentModules[node.moduleId] = node.dependencies;
    childModules[node.moduleId] = node.dependents;
  }

  const missingDependencies = modules.flatMap((enterpriseModule) =>
    enterpriseModule.dependencies
      .filter((dep) => !moduleIds.has(dep))
      .map((missing) => ({ moduleId: enterpriseModule.moduleId, missing })),
  );

  const idCounts = new Map<string, number>();
  for (const enterpriseModule of modules) {
    idCounts.set(enterpriseModule.moduleId, (idCounts.get(enterpriseModule.moduleId) ?? 0) + 1);
  }
  const duplicateModules = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  const unusedModules = modules
    .filter(
      (enterpriseModule) =>
        !edges.some((e) => e.to === enterpriseModule.moduleId) &&
        enterpriseModule.dependencies.length === 0 &&
        enterpriseModule.moduleId !== "enterprise-core" &&
        enterpriseModule.moduleId !== "enterprise-module-registry-v2",
    )
    .map((m) => m.moduleId);

  const versionConflicts: DependencyGraphAnalysis["versionConflicts"] = [];
  for (const enterpriseModule of modules) {
    for (const depId of enterpriseModule.dependencies) {
      const dep = modules.find((m) => m.moduleId === depId);
      if (dep && dep.compatibilityVersion !== enterpriseModule.compatibilityVersion && dep.category !== enterpriseModule.category) {
        versionConflicts.push({
          moduleId: enterpriseModule.moduleId,
          dependency: depId,
          expected: enterpriseModule.compatibilityVersion,
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
