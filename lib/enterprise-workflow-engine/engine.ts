import type {
  WorkflowDefinition,
  WorkflowEngineSettings,
  WorkflowExecution,
  WorkflowSchedule,
} from "@/lib/enterprise-workflow-engine/types";
import { DEFAULT_WORKFLOW_TEMPLATES } from "@/lib/enterprise-workflow-engine/templates";
import { templateToWorkflow } from "@/lib/enterprise-workflow-engine/templates";
import { createSchedule } from "@/lib/enterprise-workflow-engine/scheduler";

export function createDefaultWorkflowEngineSettings(): WorkflowEngineSettings {
  return {
    maxConcurrentExecutions: 50,
    defaultRetryAttempts: 3,
    defaultRetryDelayMs: 5000,
    approvalTimeoutMinutes: 60,
    enableBackgroundWorkers: true,
    enableBatchExecution: true,
    enableWebhookTriggers: true,
    enableCronScheduler: true,
  };
}

export function createDefaultWorkflows(): WorkflowDefinition[] {
  return DEFAULT_WORKFLOW_TEMPLATES.slice(0, 3).map((t) => ({
    ...templateToWorkflow(t, "system"),
    status: "published",
    enabled: true,
    publishedAt: new Date().toISOString(),
  }));
}

export function createDefaultExecutions(workflows: WorkflowDefinition[]): WorkflowExecution[] {
  const now = Date.now();
  return workflows.slice(0, 2).map((w, i) => ({
    id: `exec-default-${i}`,
    workflowId: w.id,
    workflowName: w.name,
    trigger: w.trigger,
    status: i === 0 ? "completed" : "waiting-approval",
    startedAt: new Date(now - 3600_000).toISOString(),
    completedAt: i === 0 ? new Date(now - 3500_000).toISOString() : undefined,
    runtimeMs: i === 0 ? 1200 : undefined,
    queueTimeMs: 50,
    attempt: 1,
    auditTrail: [`queued`, `visited:start`, i === 0 ? "visited:end" : "approval:pending"],
  }));
}

export function createDefaultSchedules(workflows: WorkflowDefinition[]): WorkflowSchedule[] {
  const cronWorkflow = workflows.find((w) => w.trigger === "cron");
  if (!cronWorkflow) return [];
  return [createSchedule(cronWorkflow.id, "0 8 * * *", "UTC")];
}

export type WorkflowEngineState = {
  workflows: WorkflowDefinition[];
  executions: WorkflowExecution[];
  schedules: WorkflowSchedule[];
};

export function createDefaultWorkflowEngineState(): WorkflowEngineState {
  const workflows = createDefaultWorkflows();
  return {
    workflows,
    executions: createDefaultExecutions(workflows),
    schedules: createDefaultSchedules(workflows),
  };
}

export function findWorkflow(workflows: WorkflowDefinition[], id: string): WorkflowDefinition | undefined {
  return workflows.find((w) => w.id === id);
}

export function upsertWorkflow(workflows: WorkflowDefinition[], workflow: WorkflowDefinition): WorkflowDefinition[] {
  const index = workflows.findIndex((w) => w.id === workflow.id);
  if (index >= 0) {
    const next = [...workflows];
    next[index] = workflow;
    return next;
  }
  return [...workflows, workflow];
}

export function deleteWorkflow(workflows: WorkflowDefinition[], id: string): WorkflowDefinition[] {
  return workflows.filter((w) => w.id !== id);
}
