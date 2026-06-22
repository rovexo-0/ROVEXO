import type { DecisionTree, HelpTopicSlug } from "@/lib/help/types";
import { buildGenericDecisionTree, TOPIC_SEEDS } from "@/lib/help/content/topics";
import { WITHDRAW_DECISION_TREE } from "@/lib/help/decision-trees/trees/withdraw";

const CUSTOM_TREES: Partial<Record<HelpTopicSlug, DecisionTree>> = {
  withdraw: WITHDRAW_DECISION_TREE,
};

const GENERIC_TREES = Object.fromEntries(
  TOPIC_SEEDS.filter((seed) => seed.slug !== "withdraw").map((seed) => [
    seed.slug,
    buildGenericDecisionTree(seed),
  ]),
) as Record<HelpTopicSlug, DecisionTree>;

export const DECISION_TREE_REGISTRY: Record<HelpTopicSlug, DecisionTree> = {
  ...GENERIC_TREES,
  ...CUSTOM_TREES,
} as Record<HelpTopicSlug, DecisionTree>;

export function getDecisionTree(topicSlug: HelpTopicSlug | string): DecisionTree | null {
  return DECISION_TREE_REGISTRY[topicSlug as HelpTopicSlug] ?? null;
}

export function getAllDecisionTrees(): DecisionTree[] {
  return Object.values(DECISION_TREE_REGISTRY);
}
