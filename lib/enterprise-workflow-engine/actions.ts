import { canPerformWorkflowAction } from "@/lib/enterprise-workflow-engine/audit";
import { getWorkflowEngineLiveDocument, workflowEngineConfigLifecycle } from "@/lib/enterprise-workflow-engine/config";
import { executeWorkflowEngineConfigAction, isWorkflowEngineConfigAction } from "@/lib/enterprise-workflow-engine/config-actions";
import { findWorkflow } from "@/lib/enterprise-workflow-engine/engine";
import {
  applyExecutionResult,
  createExecution,
  runWorkflowGraph,
  shouldRetry,
  retryExecution,
} from "@/lib/enterprise-workflow-engine/executor";
import { getWorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/reader";
import { templateToWorkflow } from "@/lib/enterprise-workflow-engine/templates";
import { getWorkflowTemplate } from "@/lib/enterprise-workflow-engine/templates";
import type { WorkflowEngineConfigDocument } from "@/lib/enterprise-workflow-engine/config";
import type { WorkflowRunInput } from "@/lib/enterprise-workflow-engine/types";

export async function executeWorkflowEngineAction(
  action: string,
  actorId: string,
  payload?: Record<string, unknown>,
) {
  if (isWorkflowEngineConfigAction(action)) {
    return executeWorkflowEngineConfigAction(action, actorId, payload as { document?: WorkflowEngineConfigDocument; historyId?: string });
  }

  const permission = canPerformWorkflowAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getWorkflowEngineLiveDocument();

  switch (action) {
    case "run": {
      const input = payload as unknown as WorkflowRunInput;
      const workflow = findWorkflow(live.settings.workflows, input.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      const execution = createExecution(workflow, input.trigger ?? workflow.trigger);
      const result = runWorkflowGraph(workflow, execution.id);
      const completed = applyExecutionResult(execution, result);
      const next = {
        ...live,
        settings: {
          ...live.settings,
          executions: [completed, ...live.settings.executions].slice(0, 100),
        },
      };
      await workflowEngineConfigLifecycle.saveDraft(next, actorId);
      return { execution: completed, result };
    }
    case "create-from-template": {
      const templateId = String(payload?.templateId ?? "");
      const template = getWorkflowTemplate(templateId);
      if (!template) throw new Error("Template not found");
      const workflow = templateToWorkflow(template, actorId);
      const next = {
        ...live,
        settings: { ...live.settings, workflows: [...live.settings.workflows, workflow] },
      };
      await workflowEngineConfigLifecycle.saveDraft(next, actorId);
      return { workflow };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export async function runWorkflowById(workflowId: string, actorId: string) {
  return executeWorkflowEngineAction("run", actorId, { workflowId });
}

export async function exportWorkflowConfiguration() {
  const doc = await workflowEngineConfigLifecycle.exportDocument();
  return doc;
}

export async function importWorkflowConfiguration(document: WorkflowEngineConfigDocument, actorId: string) {
  return executeWorkflowEngineConfigAction("import-config", actorId, { document });
}

export async function publishWorkflowConfiguration(actorId: string) {
  return executeWorkflowEngineConfigAction("publish", actorId);
}

export async function rollbackWorkflowConfiguration(historyId: string, actorId: string) {
  return executeWorkflowEngineConfigAction("rollback", actorId, { historyId });
}

export { getWorkflowEngineSnapshot, shouldRetry, retryExecution };
