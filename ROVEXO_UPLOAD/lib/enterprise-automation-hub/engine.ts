import type {
  AutomationDashboard,
  AutomationSettings,
  AutomationState,
  AutomationWorkflow,
  ApprovalRequest,
  AutomationRule,
  EventTriggerConfig,
  ExecutionRecord,
  WorkflowTemplate,
  AutomationSchedule,
  WorkflowVersion,
} from "@/lib/enterprise-automation-hub/types";
import { AUTOMATION_TYPES, EVENT_TRIGGERS, WORKFLOW_EXECUTION_MODES } from "@/lib/enterprise-automation-hub/registry";

export function createDefaultAutomationSettings(): AutomationSettings {
  return {
    mfaRequiredForPublish: true,
    autoApprovalEnabled: false,
    maxParallelJobs: 12,
    defaultExecutionMode: "sequential",
    aiSuggestionsEnabled: true,
  };
}

function createWorkflows(): AutomationWorkflow[] {
  return AUTOMATION_TYPES.slice(0, 8).map((type, i) => ({
    id: `wf-${type}`,
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Automation`,
    type,
    mode: WORKFLOW_EXECUTION_MODES[i % WORKFLOW_EXECUTION_MODES.length]!,
    status: i % 5 === 0 ? "paused" : i % 7 === 0 ? "failed" : "enabled",
    version: "1.0.0",
    steps: 4 + (i % 6),
    enabled: i % 5 !== 0,
    lastRunAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function createRules(): AutomationRule[] {
  return [
    { id: "rule-1", name: "High-value order approval", condition: "order.total", operator: "greater-than", action: "require-approval", enabled: true, priority: 1 },
    { id: "rule-2", name: "Fraud score block", condition: "fraud.score", operator: "greater-than", action: "block-transaction", enabled: true, priority: 2 },
    { id: "rule-3", name: "New seller verification", condition: "seller.verified", operator: "equals", action: "notify-compliance", enabled: true, priority: 3 },
    { id: "rule-4", name: "Listing quality gate", condition: "listing.quality", operator: "less-than", action: "hold-publish", enabled: true, priority: 4 },
    { id: "rule-5", name: "Refund auto-approve", condition: "refund.amount", operator: "less-than", action: "auto-approve", enabled: false, priority: 5 },
  ];
}

function createEventTriggers(): EventTriggerConfig[] {
  return EVENT_TRIGGERS.slice(0, 12).map((trigger, i) => ({
    id: `evt-${trigger}`,
    trigger,
    workflowId: `wf-${AUTOMATION_TYPES[i % AUTOMATION_TYPES.length]}`,
    enabled: i % 4 !== 0,
    description: `Trigger automation on ${trigger.replace(/-/g, " ")}`,
  }));
}

function createTemplates(): WorkflowTemplate[] {
  return AUTOMATION_TYPES.slice(0, 6).map((type, i) => ({
    id: `tpl-${type}`,
    name: `${type} template`,
    type,
    description: `Reusable ${type} workflow template`,
    steps: 3 + i,
    reusable: true,
  }));
}

function createSchedules(): AutomationSchedule[] {
  return [
    { id: "sch-1", workflowId: "wf-analytics", cron: "0 */6 * * *", label: "Analytics sync", nextRunAt: new Date(Date.now() + 7200000).toISOString(), enabled: true },
    { id: "sch-2", workflowId: "wf-security", cron: "0 0 * * *", label: "Security scan", nextRunAt: new Date(Date.now() + 86400000).toISOString(), enabled: true },
    { id: "sch-3", workflowId: "wf-notification", cron: "*/15 * * * *", label: "Digest notifications", nextRunAt: new Date(Date.now() + 900000).toISOString(), enabled: true },
  ];
}

function createExecutions(): ExecutionRecord[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `exec-${i + 1}`,
    workflowId: `wf-${AUTOMATION_TYPES[i % AUTOMATION_TYPES.length]}`,
    workflowVersion: "1.0.0",
    triggeredBy: i % 2 === 0 ? "event:order-created" : "schedule",
    status: i === 3 ? "failed" : i === 5 ? "running" : "completed",
    durationMs: 1200 + i * 340,
    startedAt: new Date(Date.now() - i * 1800000).toISOString(),
    completedAt: i === 5 ? undefined : new Date(Date.now() - i * 1800000 + 2000).toISOString(),
    error: i === 3 ? "Timeout exceeded" : undefined,
    rollbackAvailable: i <= 2,
  }));
}

function createApprovals(): ApprovalRequest[] {
  return [
    { id: "apr-1", workflowId: "wf-payment", status: "pending-approval", requestedBy: "admin", requestedAt: new Date().toISOString(), version: "1.1.0" },
    { id: "apr-2", workflowId: "wf-security", status: "approved", requestedBy: "admin", requestedAt: new Date(Date.now() - 86400000).toISOString(), reviewedBy: "super-admin", version: "2.0.0" },
    { id: "apr-3", workflowId: "wf-deployment", status: "draft", requestedBy: "admin", requestedAt: new Date().toISOString(), version: "1.0.1" },
  ];
}

function createVersions(): WorkflowVersion[] {
  return [
    { id: "ver-1", workflowId: "wf-marketplace", version: "1.2.0", publishedAt: new Date().toISOString(), publishedBy: "super-admin", rollbackAvailable: true },
    { id: "ver-2", workflowId: "wf-payment", version: "2.0.0", publishedAt: new Date(Date.now() - 172800000).toISOString(), publishedBy: "super-admin", rollbackAvailable: true },
  ];
}

export function createDefaultAutomationState(): AutomationState {
  return {
    workflows: createWorkflows(),
    rules: createRules(),
    eventTriggers: createEventTriggers(),
    templates: createTemplates(),
    schedules: createSchedules(),
    executions: createExecutions(),
    approvals: createApprovals(),
    versions: createVersions(),
    aiInsights: [],
  };
}

export function buildAutomationDashboard(state: AutomationState): AutomationDashboard {
  const runningJobs = state.executions.filter((e) => e.status === "running").length;
  const failedJobs = state.executions.filter((e) => e.status === "failed").length;
  const pausedJobs = state.workflows.filter((w) => w.status === "paused" || !w.enabled).length;
  const scheduledJobs = state.schedules.filter((s) => s.enabled).length;
  const completed = state.executions.filter((e) => e.status === "completed");
  const avgDuration = completed.length
    ? Math.round(completed.reduce((s, e) => s + e.durationMs, 0) / completed.length)
    : 0;
  const successRate = state.executions.length
    ? Math.round((completed.length / state.executions.length) * 100)
    : 100;

  return {
    activeWorkflows: state.workflows.filter((w) => w.enabled).length,
    runningJobs,
    scheduledJobs,
    pausedJobs,
    failedJobs,
    aiAutomations: state.aiInsights.length,
    approvalQueue: state.approvals.filter((a) => a.status === "pending-approval").length,
    averageExecutionTimeMs: avgDuration,
    successRate,
    rollbackQueue: state.versions.filter((v) => v.rollbackAvailable).length,
    automationHealth: Math.min(100, successRate + (state.workflows.filter((w) => w.enabled).length > 0 ? 5 : 0)),
  };
}

export function refreshAutomationState(state: AutomationState): AutomationState {
  return {
    ...state,
    executions: createExecutions(),
  };
}
