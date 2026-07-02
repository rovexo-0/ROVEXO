import type {
  WorkflowAnalytics,
  WorkflowDashboardMetrics,
  WorkflowExecution,
  WorkflowDefinition,
  WorkflowApprovalStep,
  WorkflowTriggerType,
} from "@/lib/enterprise-workflow-engine/types";
import { averageApprovalTimeMs } from "@/lib/enterprise-workflow-engine/approval";

export function buildWorkflowAnalytics(
  executions: WorkflowExecution[],
  approvals: WorkflowApprovalStep[],
): WorkflowAnalytics {
  const completed = executions.filter((e) => e.status === "completed" || e.status === "failed");
  const successful = completed.filter((e) => e.status === "completed");
  const failed = completed.filter((e) => e.status === "failed");
  const count = completed.length || 1;

  const avgRuntime =
    completed.reduce((sum, e) => sum + (e.runtimeMs ?? 0), 0) / count;
  const avgQueue =
    executions.reduce((sum, e) => sum + (e.queueTimeMs ?? 0), 0) / (executions.length || 1);

  const triggerMap = new Map<WorkflowTriggerType, number>();
  for (const exec of executions) {
    triggerMap.set(exec.trigger, (triggerMap.get(exec.trigger) ?? 0) + 1);
  }

  return {
    executionCount: executions.length,
    averageRuntimeMs: Math.round(avgRuntime),
    successRate: Math.round((successful.length / count) * 100),
    failureRate: Math.round((failed.length / count) * 100),
    averageQueueTimeMs: Math.round(avgQueue),
    averageApprovalTimeMs: averageApprovalTimeMs(approvals),
    triggerStats: [...triggerMap.entries()].map(([trigger, c]) => ({ trigger, count: c })),
    performanceScore: Math.round((successful.length / count) * 100),
    resourceUsagePercent: Math.min(100, Math.round(executions.filter((e) => e.status === "running").length * 10)),
  };
}

export function buildWorkflowDashboard(
  workflows: WorkflowDefinition[],
  executions: WorkflowExecution[],
  approvals: WorkflowApprovalStep[],
  schedulesCount: number,
  analytics: WorkflowAnalytics,
): WorkflowDashboardMetrics {
  return {
    totalWorkflows: workflows.length,
    publishedWorkflows: workflows.filter((w) => w.status === "published").length,
    draftWorkflows: workflows.filter((w) => w.status === "draft").length,
    activeExecutions: executions.filter((e) => e.status === "running" || e.status === "queued").length,
    pendingApprovals: approvals.filter((a) => a.status === "pending").length,
    scheduledJobs: schedulesCount,
    successRate: analytics.successRate,
    healthScore: Math.round((analytics.successRate + (100 - analytics.failureRate)) / 2),
  };
}

export function filterExecutionsByStatus(
  executions: WorkflowExecution[],
  status: WorkflowExecution["status"],
): WorkflowExecution[] {
  return executions.filter((e) => e.status === status);
}

export function topTriggers(analytics: WorkflowAnalytics, limit = 5) {
  return [...analytics.triggerStats].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function computeHealthScore(analytics: WorkflowAnalytics, enabled: boolean): number {
  if (!enabled) return 0;
  return Math.round((analytics.performanceScore + (100 - analytics.resourceUsagePercent)) / 2);
}
