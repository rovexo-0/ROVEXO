import type { DecisionNode, DecisionOption, DecisionTree, HelpSolution } from "@/lib/help/types";

export function getDecisionNode(tree: DecisionTree, nodeId: string): DecisionNode | null {
  return tree.nodes[nodeId] ?? null;
}

export function getDecisionSolution(tree: DecisionTree, solutionId: string): HelpSolution | null {
  return tree.solutions[solutionId] ?? null;
}

export function resolveDecisionOption(
  tree: DecisionTree,
  nodeId: string,
  optionId: string,
): {
  nextNode: DecisionNode | null;
  solution: HelpSolution | null;
  option: DecisionOption | null;
} {
  const current = getDecisionNode(tree, nodeId);
  const selected = current?.options.find((entry) => entry.id === optionId) ?? null;
  if (!selected) {
    return { nextNode: null, solution: null, option: null };
  }

  if (selected.solutionId) {
    return {
      nextNode: null,
      solution: getDecisionSolution(tree, selected.solutionId),
      option: selected,
    };
  }

  if (selected.nextNodeId) {
    return {
      nextNode: getDecisionNode(tree, selected.nextNodeId),
      solution: null,
      option: selected,
    };
  }

  return { nextNode: null, solution: null, option: selected };
}

export function isTreeTerminal(tree: DecisionTree, nodeId: string): boolean {
  const nodeEntry = getDecisionNode(tree, nodeId);
  if (!nodeEntry) return true;
  return nodeEntry.options.every((entry) => Boolean(entry.solutionId) && !entry.nextNodeId);
}
