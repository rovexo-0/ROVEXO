import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowGraphResult,
  WorkflowNode,
} from "@/lib/enterprise-workflow-engine/types";
import { createApprovalChain, resolveApprovalStatus } from "@/lib/enterprise-workflow-engine/approval";
import { validateWorkflowGraph } from "@/lib/enterprise-workflow-engine/builder";

export function executeNode(node: WorkflowNode): { ok: boolean; output?: Record<string, unknown>; error?: string } {
  switch (node.type) {
    case "start":
    case "end":
    case "merge":
    case "split":
      return { ok: true };
    case "delay":
    case "timer":
      return { ok: true, output: { delayedMs: Number(node.config.delayMs ?? 0) } };
    case "condition":
    case "decision":
    case "switch":
      return { ok: true, output: { branch: node.next?.[0] ?? "end" } };
    case "approval":
      return { ok: true, output: { requiresApproval: true } };
    case "http-request":
      return { ok: true, output: { status: 200, method: node.config.method ?? "GET" } };
    case "database":
    case "queue":
    case "notification":
    case "email":
    case "payment":
    case "shipping":
    case "ai-action":
    case "loop":
      return { ok: true, output: { executed: node.type } };
    default:
      return { ok: false, error: `Unknown node type: ${node.type}` };
  }
}

export function traverseWorkflowGraph(
  workflow: WorkflowDefinition,
  startNodeId = "start",
): { visited: string[]; error?: string } {
  const validation = validateWorkflowGraph(workflow);
  if (!validation.valid) return { visited: [], error: validation.errors.join("; ") };

  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
  const visited: string[] = [];
  let current: string | undefined = startNodeId;

  while (current) {
    if (visited.includes(current)) return { visited, error: `Cycle detected at ${current}` };
    const node = nodeMap.get(current);
    if (!node) return { visited, error: `Missing node ${current}` };
    visited.push(current);
    if (node.type === "end") break;
    current = node.next?.[0];
  }

  return { visited };
}

export function runWorkflowGraph(
  workflow: WorkflowDefinition,
  executionId: string,
): WorkflowGraphResult {
  const started = Date.now();
  const { visited, error } = traverseWorkflowGraph(workflow);

  if (error) {
    return { executionId, status: "failed", visitedNodes: visited, runtimeMs: Date.now() - started, error };
  }

  const hasApproval = workflow.nodes.some((n) => n.type === "approval") && workflow.approvalRequired;
  const status: WorkflowExecutionStatus = hasApproval ? "waiting-approval" : "completed";

  return {
    executionId,
    status,
    visitedNodes: visited,
    runtimeMs: Date.now() - started,
  };
}

export function createExecution(
  workflow: WorkflowDefinition,
  trigger = workflow.trigger,
  queueTimeMs = 0,
): WorkflowExecution {
  const now = new Date().toISOString();
  return {
    id: `exec-${workflow.id}-${Date.now()}`,
    workflowId: workflow.id,
    workflowName: workflow.name,
    trigger,
    status: "queued",
    startedAt: now,
    queueTimeMs,
    attempt: 1,
    auditTrail: [`queued:${now}`],
  };
}

export function applyExecutionResult(
  execution: WorkflowExecution,
  result: WorkflowGraphResult,
): WorkflowExecution {
  return {
    ...execution,
    status: result.status,
    completedAt: result.status === "completed" || result.status === "failed" ? new Date().toISOString() : undefined,
    runtimeMs: result.runtimeMs,
    currentNodeId: result.visitedNodes[result.visitedNodes.length - 1],
    error: result.error,
    auditTrail: [...execution.auditTrail, ...result.visitedNodes.map((n) => `visited:${n}`)],
  };
}

export function shouldRetry(execution: WorkflowExecution, maxAttempts: number): boolean {
  return execution.status === "failed" && execution.attempt < maxAttempts;
}

export function retryExecution(execution: WorkflowExecution, delayMs: number): WorkflowExecution {
  return {
    ...execution,
    status: "retrying",
    attempt: execution.attempt + 1,
    error: undefined,
    auditTrail: [...execution.auditTrail, `retry:attempt-${execution.attempt + 1}:delay-${delayMs}`],
  };
}

export function finalizeExecutionWithApprovals(
  execution: WorkflowExecution,
  workflow: WorkflowDefinition,
): { execution: WorkflowExecution; approvals: ReturnType<typeof createApprovalChain> } {
  const approvals = createApprovalChain(execution.id, workflow);
  const status = resolveApprovalStatus(approvals);
  return {
    execution: {
      ...execution,
      status: status === "approved" ? "completed" : "waiting-approval",
      auditTrail: [...execution.auditTrail, ...approvals.map((a) => `approval:${a.id}:${a.status}`)],
    },
    approvals,
  };
}

export function runBatchExecutions(
  workflows: WorkflowDefinition[],
  workflowIds: string[],
): WorkflowGraphResult[] {
  return workflowIds
    .map((id) => workflows.find((w) => w.id === id))
    .filter((w): w is WorkflowDefinition => Boolean(w))
    .map((workflow) => runWorkflowGraph(workflow, createExecution(workflow).id));
}
