import type { DecisionNode, DecisionOption, DecisionTree, HelpSolution, HelpTopicSlug } from "@/lib/help/types";

export function node(id: string, question: string, options: DecisionOption[]): DecisionNode {
  return { id, question, options };
}

export function option(
  id: string,
  label: string,
  target: { nextNodeId?: string; solutionId?: string; articleSlug?: string; topicSlug?: HelpTopicSlug },
): DecisionOption {
  return { id, label, ...target };
}

export function solution(
  id: string,
  partial: Omit<HelpSolution, "id">,
): HelpSolution {
  return { id, ...partial };
}

export function tree(
  topicSlug: HelpTopicSlug,
  title: string,
  rootNodeId: string,
  nodes: DecisionNode[],
  solutions: HelpSolution[],
): DecisionTree {
  return {
    topicSlug,
    title,
    rootNodeId,
    nodes: Object.fromEntries(nodes.map((entry) => [entry.id, entry])),
    solutions: Object.fromEntries(solutions.map((entry) => [entry.id, entry])),
  };
}
