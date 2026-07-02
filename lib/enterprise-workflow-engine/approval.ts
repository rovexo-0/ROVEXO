import type {
  WorkflowApprovalMode,
  WorkflowApprovalStatus,
  WorkflowApprovalStep,
  WorkflowDefinition,
} from "@/lib/enterprise-workflow-engine/types";

export function createApprovalChain(
  executionId: string,
  workflow: WorkflowDefinition,
  mode: WorkflowApprovalMode = "sequential",
): WorkflowApprovalStep[] {
  const approvalNodes = workflow.nodes.filter((n) => n.type === "approval");
  const timeoutAt = new Date(Date.now() + 60 * 60_000).toISOString();

  return approvalNodes.map((node, index) => ({
    id: `appr-${executionId}-${index}`,
    executionId,
    workflowId: workflow.id,
    mode,
    role: String(node.config.role ?? "workflow-admin"),
    status: index === 0 || mode === "parallel" ? "pending" : "pending",
    timeoutAt,
    rejectPath: String(node.config.rejectPath ?? "end"),
    rollbackPath: String(node.config.rollbackPath ?? "start"),
  }));
}

export function resolveApprovalStatus(
  steps: WorkflowApprovalStep[],
): "pending" | "approved" | "rejected" | "timeout" {
  if (steps.length === 0) return "pending";
  if (steps.some((s) => s.status === "rejected")) return "rejected";
  if (steps.some((s) => s.status === "timeout")) return "timeout";
  if (steps.every((s) => s.status === "approved")) return "approved";
  return "pending";
}

export function approveStep(steps: WorkflowApprovalStep[], stepId: string, actor: string): WorkflowApprovalStep[] {
  return steps.map((s) =>
    s.id === stepId ? { ...s, status: "approved" as WorkflowApprovalStatus, assignedTo: actor, decidedAt: new Date().toISOString() } : s,
  );
}

export function rejectStep(steps: WorkflowApprovalStep[], stepId: string, actor: string): WorkflowApprovalStep[] {
  return steps.map((s) =>
    s.id === stepId ? { ...s, status: "rejected" as WorkflowApprovalStatus, assignedTo: actor, decidedAt: new Date().toISOString() } : s,
  );
}

export function timeoutExpiredSteps(steps: WorkflowApprovalStep[], now = Date.now()): WorkflowApprovalStep[] {
  return steps.map((s) => {
    if (s.status !== "pending" || !s.timeoutAt) return s;
    if (new Date(s.timeoutAt).getTime() <= now) {
      return { ...s, status: "timeout" as WorkflowApprovalStatus, decidedAt: new Date().toISOString() };
    }
    return s;
  });
}

export function getNextSequentialStep(steps: WorkflowApprovalStep[]): WorkflowApprovalStep | undefined {
  return steps.find((s) => s.status === "pending");
}

export function averageApprovalTimeMs(steps: WorkflowApprovalStep[]): number {
  const completed = steps.filter((s) => s.decidedAt && s.status === "approved");
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, s) => {
    const decided = new Date(s.decidedAt!).getTime();
    const started = decided - 30_000;
    return sum + (decided - started);
  }, 0);
  return Math.round(total / completed.length);
}

export function buildApprovalAuditTrail(steps: WorkflowApprovalStep[]): string[] {
  return steps.map((s) => `${s.id}:${s.status}:${s.role}${s.assignedTo ? `:${s.assignedTo}` : ""}`);
}
