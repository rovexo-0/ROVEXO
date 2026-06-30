import type {
  AI_AUTOMATION_SOURCES,
  APPROVAL_STATUSES,
  AUTOMATION_TYPES,
  EVENT_TRIGGERS,
  EXPORT_FORMATS,
  JOB_STATUSES,
  RULE_OPERATORS,
  WORKFLOW_EXECUTION_MODES,
} from "@/lib/enterprise-automation-hub/registry";

export type AutomationTab =
  | "dashboard"
  | "workflows"
  | "rules"
  | "events"
  | "templates"
  | "schedules"
  | "history"
  | "monitoring"
  | "approvals"
  | "versions"
  | "settings";

export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type AutomationType = (typeof AUTOMATION_TYPES)[number];
export type WorkflowExecutionMode = (typeof WORKFLOW_EXECUTION_MODES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type RuleOperator = (typeof RULE_OPERATORS)[number];
export type AutomationExportFormat = (typeof EXPORT_FORMATS)[number];
export type AiAutomationSource = (typeof AI_AUTOMATION_SOURCES)[number];

export type AutomationWorkflow = {
  id: string;
  name: string;
  type: AutomationType;
  mode: WorkflowExecutionMode;
  status: JobStatus | "enabled" | "disabled";
  version: string;
  steps: number;
  enabled: boolean;
  lastRunAt?: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  condition: string;
  operator: RuleOperator;
  action: string;
  enabled: boolean;
  priority: number;
};

export type EventTriggerConfig = {
  id: string;
  trigger: EventTrigger;
  workflowId: string;
  enabled: boolean;
  description: string;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  type: AutomationType;
  description: string;
  steps: number;
  reusable: boolean;
};

export type AutomationSchedule = {
  id: string;
  workflowId: string;
  cron: string;
  label: string;
  nextRunAt: string;
  enabled: boolean;
};

export type ExecutionRecord = {
  id: string;
  workflowId: string;
  workflowVersion: string;
  triggeredBy: string;
  status: JobStatus;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  rollbackAvailable: boolean;
};

export type ApprovalRequest = {
  id: string;
  workflowId: string;
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  version: string;
};

export type WorkflowVersion = {
  id: string;
  workflowId: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  rollbackAvailable: boolean;
};

export type AiAutomationInsight = {
  id: string;
  source: AiAutomationSource;
  type: "suggestion" | "risk" | "optimization" | "repair" | "recovery";
  summary: string;
  confidence: number;
  workflowId?: string;
};

export type AutomationSettings = {
  mfaRequiredForPublish: boolean;
  autoApprovalEnabled: boolean;
  maxParallelJobs: number;
  defaultExecutionMode: WorkflowExecutionMode;
  aiSuggestionsEnabled: boolean;
};

export type AutomationDashboard = {
  activeWorkflows: number;
  runningJobs: number;
  scheduledJobs: number;
  pausedJobs: number;
  failedJobs: number;
  aiAutomations: number;
  approvalQueue: number;
  averageExecutionTimeMs: number;
  successRate: number;
  rollbackQueue: number;
  automationHealth: number;
};

export type AutomationState = {
  workflows: AutomationWorkflow[];
  rules: AutomationRule[];
  eventTriggers: EventTriggerConfig[];
  templates: WorkflowTemplate[];
  schedules: AutomationSchedule[];
  executions: ExecutionRecord[];
  approvals: ApprovalRequest[];
  versions: WorkflowVersion[];
  aiInsights: AiAutomationInsight[];
};

export type AutomationSnapshot = {
  tab: AutomationTab;
  dashboard: AutomationDashboard;
  workflows: AutomationWorkflow[];
  rules: AutomationRule[];
  eventTriggers: EventTriggerConfig[];
  templates: WorkflowTemplate[];
  schedules: AutomationSchedule[];
  executions: ExecutionRecord[];
  approvals: ApprovalRequest[];
  versions: WorkflowVersion[];
  aiInsights: AiAutomationInsight[];
  settings: AutomationSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
