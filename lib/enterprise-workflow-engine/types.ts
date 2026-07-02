import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import type { WORKFLOW_NODE_TYPES, WORKFLOW_TRIGGER_TYPES } from "@/lib/enterprise-workflow-engine/registry";

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];
export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number];

export type WorkflowEngineTab =
  | "dashboard"
  | "workflows"
  | "builder"
  | "templates"
  | "executions"
  | "scheduler"
  | "approvals"
  | "analytics"
  | "versions"
  | "history"
  | "settings";

export type WorkflowStatus = "draft" | "published" | "archived" | "disabled";
export type WorkflowExecutionStatus = "queued" | "running" | "waiting-approval" | "completed" | "failed" | "cancelled" | "retrying";
export type WorkflowApprovalMode = "sequential" | "parallel";
export type WorkflowApprovalStatus = "pending" | "approved" | "rejected" | "timeout" | "rolled-back";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
  next?: string[];
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  trigger: WorkflowTriggerType;
  nodes: WorkflowNode[];
  tags: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  enabled: boolean;
  retryPolicy: { maxAttempts: number; delayMs: number };
  approvalRequired: boolean;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: WorkflowTriggerType;
  nodes: WorkflowNode[];
  tags: string[];
};

export type WorkflowExecution = {
  id: string;
  workflowId: string;
  workflowName: string;
  trigger: WorkflowTriggerType;
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt?: string;
  runtimeMs?: number;
  queueTimeMs?: number;
  currentNodeId?: string;
  attempt: number;
  error?: string;
  auditTrail: string[];
};

export type WorkflowApprovalStep = {
  id: string;
  executionId: string;
  workflowId: string;
  mode: WorkflowApprovalMode;
  role: string;
  status: WorkflowApprovalStatus;
  assignedTo?: string;
  decidedAt?: string;
  timeoutAt?: string;
  rejectPath?: string;
  rollbackPath?: string;
};

export type WorkflowSchedule = {
  id: string;
  workflowId: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
};

export type WorkflowAnalytics = {
  executionCount: number;
  averageRuntimeMs: number;
  successRate: number;
  failureRate: number;
  averageQueueTimeMs: number;
  averageApprovalTimeMs: number;
  triggerStats: { trigger: WorkflowTriggerType; count: number }[];
  performanceScore: number;
  resourceUsagePercent: number;
};

export type WorkflowDashboardMetrics = {
  totalWorkflows: number;
  publishedWorkflows: number;
  draftWorkflows: number;
  activeExecutions: number;
  pendingApprovals: number;
  scheduledJobs: number;
  successRate: number;
  healthScore: number;
};

export type WorkflowVersionEntry = {
  id: string;
  workflowId: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  rollbackAvailable: boolean;
  changeSummary: string;
};

export type WorkflowEngineSettings = {
  maxConcurrentExecutions: number;
  defaultRetryAttempts: number;
  defaultRetryDelayMs: number;
  approvalTimeoutMinutes: number;
  enableBackgroundWorkers: boolean;
  enableBatchExecution: boolean;
  enableWebhookTriggers: boolean;
  enableCronScheduler: boolean;
};

export type WorkflowEngineSnapshot = {
  tab: WorkflowEngineTab;
  dashboard: WorkflowDashboardMetrics;
  analytics: WorkflowAnalytics;
  workflows: WorkflowDefinition[];
  templates: WorkflowTemplate[];
  executions: WorkflowExecution[];
  approvals: WorkflowApprovalStep[];
  schedules: WorkflowSchedule[];
  versions: WorkflowVersionEntry[];
  history: WorkflowVersionEntry[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlags: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};

/** Alias for Enterprise Registry V2 descriptor compatibility */
export type WorkflowEngineDescriptor = EnterpriseModuleDescriptor;

export type WorkflowGraphResult = {
  executionId: string;
  status: WorkflowExecutionStatus;
  visitedNodes: string[];
  runtimeMs: number;
  error?: string;
};

export type WorkflowRunInput = {
  workflowId: string;
  trigger?: WorkflowTriggerType;
  payload?: Record<string, unknown>;
  manual?: boolean;
};

export type WorkflowVersionCompare = {
  workflowId: string;
  fromVersion: string;
  toVersion: string;
  addedNodes: string[];
  removedNodes: string[];
  changedNodes: string[];
};
