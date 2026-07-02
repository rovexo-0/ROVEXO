import type { WorkflowDefinition, WorkflowNode, WorkflowNodeType } from "@/lib/enterprise-workflow-engine/types";
import { WORKFLOW_NODE_TYPES } from "@/lib/enterprise-workflow-engine/registry";

export function isValidNodeType(type: string): type is WorkflowNodeType {
  return (WORKFLOW_NODE_TYPES as readonly string[]).includes(type);
}

export function validateWorkflowGraph(workflow: WorkflowDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));

  if (!workflow.nodes.some((n) => n.type === "start")) errors.push("Missing start node");
  if (!workflow.nodes.some((n) => n.type === "end")) errors.push("Missing end node");

  for (const node of workflow.nodes) {
    if (!isValidNodeType(node.type)) errors.push(`Invalid node type: ${node.type}`);
    for (const next of node.next ?? []) {
      if (!nodeIds.has(next)) errors.push(`Node ${node.id} references missing node ${next}`);
    }
  }

  const startNodes = workflow.nodes.filter((n) => n.type === "start");
  if (startNodes.length > 1) errors.push("Multiple start nodes");

  return { valid: errors.length === 0, errors };
}

export function addNodeToWorkflow(
  workflow: WorkflowDefinition,
  node: WorkflowNode,
  afterNodeId?: string,
): WorkflowDefinition {
  const nodes = [...workflow.nodes, node];
  if (afterNodeId) {
    const after = nodes.find((n) => n.id === afterNodeId);
    if (after) after.next = [...(after.next ?? []), node.id];
  }
  return { ...workflow, nodes, updatedAt: new Date().toISOString() };
}

export function removeNodeFromWorkflow(workflow: WorkflowDefinition, nodeId: string): WorkflowDefinition {
  const nodes = workflow.nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({ ...n, next: n.next?.filter((id) => id !== nodeId) }));
  return { ...workflow, nodes, updatedAt: new Date().toISOString() };
}

export function buildVisualLayout(workflow: WorkflowDefinition): Array<{ node: WorkflowNode; x: number; y: number }> {
  return workflow.nodes.map((node, index) => ({
    node,
    x: (index % 4) * 220,
    y: Math.floor(index / 4) * 120,
  }));
}

export function cloneWorkflowDefinition(workflow: WorkflowDefinition, newId: string): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    ...workflow,
    id: newId,
    name: `${workflow.name} (Clone)`,
    status: "draft",
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    enabled: false,
    nodes: workflow.nodes.map((n) => ({ ...n })),
  };
}

export function compareWorkflowNodes(
  from: WorkflowDefinition,
  to: WorkflowDefinition,
): { added: string[]; removed: string[]; changed: string[] } {
  const fromIds = new Set(from.nodes.map((n) => n.id));
  const toIds = new Set(to.nodes.map((n) => n.id));
  const added = [...toIds].filter((id) => !fromIds.has(id));
  const removed = [...fromIds].filter((id) => !toIds.has(id));
  const changed = to.nodes
    .filter((n) => {
      const prev = from.nodes.find((p) => p.id === n.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(n);
    })
    .map((n) => n.id);
  return { added, removed, changed };
}
