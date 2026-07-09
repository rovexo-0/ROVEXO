import type { MosRule, RuleExecutionResult } from "@/lib/marketplace-os/types";

export type FailsafeIssue = {
  type: "conflict" | "duplicate" | "cycle" | "invalid";
  message: string;
  ruleIds: string[];
};

/** Failsafe Engine — prevents conflicting rules, cycles, and duplicate actions. */
export function validateRulesFailsafe(rules: MosRule[]): FailsafeIssue[] {
  const issues: FailsafeIssue[] = [];
  const enabled = rules.filter((rule) => rule.enabled);

  const priorityMap = new Map<number, string[]>();
  for (const rule of enabled) {
    const existing = priorityMap.get(rule.priority) ?? [];
    existing.push(rule.id);
    priorityMap.set(rule.priority, existing);
  }

  for (const [priority, ids] of priorityMap) {
    if (ids.length > 3) {
      issues.push({
        type: "conflict",
        message: `${ids.length} rules share priority ${priority}`,
        ruleIds: ids,
      });
    }
  }

  for (const rule of enabled) {
    if (rule.dependencies.includes(rule.id)) {
      issues.push({
        type: "cycle",
        message: `Rule ${rule.id} depends on itself`,
        ruleIds: [rule.id],
      });
    }
  }

  for (const rule of enabled) {
    for (const dep of rule.dependencies) {
      if (!enabled.some((entry) => entry.id === dep)) {
        issues.push({
          type: "invalid",
          message: `Rule ${rule.id} depends on disabled/missing rule ${dep}`,
          ruleIds: [rule.id, dep],
        });
      }
    }
  }

  const seenActions = new Map<string, string>();
  for (const rule of enabled) {
    for (const action of rule.actions) {
      const key = `${action.type}:${action.target}`;
      const existing = seenActions.get(key);
      if (existing && existing !== rule.id) {
        issues.push({
          type: "duplicate",
          message: `Duplicate action ${key} in rules ${existing} and ${rule.id}`,
          ruleIds: [existing, rule.id],
        });
      } else {
        seenActions.set(key, rule.id);
      }
    }
  }

  return issues;
}

export function detectDependencyCycle(rules: MosRule[]): boolean {
  const graph = new Map<string, string[]>();
  for (const rule of rules) {
    graph.set(rule.id, rule.dependencies);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const dep of graph.get(node) ?? []) {
      if (dfs(dep)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const rule of rules) {
    if (dfs(rule.id)) return true;
  }
  return false;
}

export function guardOrchestration(
  ruleResults: RuleExecutionResult[],
  maxIterations = 100,
): { allowed: boolean; reason?: string } {
  if (ruleResults.length > maxIterations) {
    return { allowed: false, reason: "max_iterations_exceeded" };
  }
  return { allowed: true };
}
