import type { MosRule, RuleCondition, RuleExecutionResult } from "@/lib/marketplace-os/types";

export type RuleContext = Record<string, string | number | boolean>;

function evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
  const actual = context[condition.field];
  if (actual === undefined) return condition.operator === "neq";

  switch (condition.operator) {
    case "eq":
      return actual === condition.value;
    case "neq":
      return actual !== condition.value;
    case "gt":
      return Number(actual) > Number(condition.value);
    case "lt":
      return Number(actual) < Number(condition.value);
    case "gte":
      return Number(actual) >= Number(condition.value);
    case "lte":
      return Number(actual) <= Number(condition.value);
    case "contains":
      return String(actual).toLowerCase().includes(String(condition.value).toLowerCase());
    default:
      return false;
  }
}

function dependenciesMet(rule: MosRule, executedRuleIds: Set<string>): boolean {
  return rule.dependencies.every((dep) => executedRuleIds.has(dep));
}

/** Global Rule Engine — deterministic conditions, priorities, dependencies, actions. */
export function executeRules(
  rules: MosRule[],
  context: RuleContext,
): RuleExecutionResult[] {
  const sorted = [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  const results: RuleExecutionResult[] = [];
  const executedIds = new Set<string>();
  const executedActions = new Set<string>();

  for (const rule of sorted) {
    if (!dependenciesMet(rule, executedIds)) {
      results.push({
        ruleId: rule.id,
        ruleVersion: rule.version,
        matched: false,
        actionsExecuted: [],
        reason: "dependency_not_met",
        skippedDueToDependency: true,
      });
      continue;
    }

    const matched =
      rule.conditions.length === 0 ||
      rule.conditions.every((condition) => evaluateCondition(condition, context));

    const actionsExecuted = matched
      ? rule.actions.filter((action) => {
          const key = `${action.type}:${action.target}`;
          if (executedActions.has(key)) return false;
          executedActions.add(key);
          return true;
        })
      : [];

    results.push({
      ruleId: rule.id,
      ruleVersion: rule.version,
      matched,
      actionsExecuted,
      reason: matched ? "conditions_met" : "conditions_not_met",
    });

    if (matched) executedIds.add(rule.id);
  }

  return results;
}

export function getActiveRules(rules: MosRule[]): MosRule[] {
  return rules.filter((rule) => rule.enabled).sort((a, b) => b.priority - a.priority);
}

export function mergeRuleThresholds(rules: MosRule[]): Partial<import("@/lib/marketplace-os/config").MosThresholds> {
  return rules.reduce(
    (acc, rule) => ({ ...acc, ...rule.thresholds }),
    {} as Partial<import("@/lib/marketplace-os/config").MosThresholds>,
  );
}
