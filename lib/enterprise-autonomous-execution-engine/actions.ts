import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformExecutionEngineAction } from "@/lib/enterprise-autonomous-execution-engine/audit";
import { getExecutionEngineLiveDocument, executionEngineConfigLifecycle } from "@/lib/enterprise-autonomous-execution-engine/config";
import { executeExecutionEngineConfigAction, isExecutionEngineConfigAction } from "@/lib/enterprise-autonomous-execution-engine/config-actions";
import type { ExecutionEngineConfigDocument } from "@/lib/enterprise-autonomous-execution-engine/config";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";
import {
  advanceRecovery,
  advanceWorkflow,
  isProtectedExecutionTarget,
  prioritizeTasks,
  processApproval,
  startRecovery,
  startWorkflow,
  syncOrchestration,
} from "@/lib/enterprise-autonomous-execution-engine/engine";
import { exportExecutionEngineSnapshot, isValidExecutionExportFormat } from "@/lib/enterprise-autonomous-execution-engine/export";
import { getExecutionEngineSnapshot } from "@/lib/enterprise-autonomous-execution-engine/reader";

export async function executeExecutionEngineAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isExecutionEngineConfigAction(action)) {
    return executeExecutionEngineConfigAction(action, actorId, payload as { document?: ExecutionEngineConfigDocument; historyId?: string });
  }

  const permission = canPerformExecutionEngineAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getExecutionEngineLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: EXECUTION_ENGINE_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.neverBypassProtectedAreas === false) {
    throw new Error("Protected area enforcement must remain enabled");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedExecutionTarget(target) && action !== "approve") {
    throw new Error("Protected area — requires approval gate before execution");
  }

  switch (action) {
    case "orchestrate": {
      const coordinations = syncOrchestration();
      await executionEngineConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, coordinations },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { modulesSynced: coordinations.length };
    }
    case "execute": {
      const workflowId = payload?.workflowId ? String(payload.workflowId) : undefined;
      if (workflowId) {
        const updated = state.workflows.map((w) => (w.id === workflowId ? advanceWorkflow(w) : w));
        await executionEngineConfigLifecycle.saveDraft(
          {
            ...live,
            settings: {
              ...state,
              workflows: updated,
              dashboard: { ...state.dashboard, runningWorkflows: updated.filter((w) => w.status === "running").length },
            },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { workflowId, advanced: true };
      }
      const type = String(payload?.workflowType ?? "development") as import("@/lib/enterprise-autonomous-execution-engine/types").EnterpriseWorkflowType;
      const workflow = startWorkflow(type);
      await executionEngineConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            workflows: [workflow, ...state.workflows].slice(0, 20),
            dashboard: { ...state.dashboard, runningWorkflows: state.dashboard.runningWorkflows + 1 },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { workflowId: workflow.id };
    }
    case "prioritize": {
      const tasks = prioritizeTasks(state.tasks);
      await executionEngineConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, tasks },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { tasksPrioritized: tasks.length };
    }
    case "approve": {
      const gateId = payload?.gateId ? String(payload.gateId) : undefined;
      if (!gateId) throw new Error("gateId required for approval");
      const approved = Boolean(payload?.approved ?? false);
      const gates = state.approvalGates.map((g) => (g.id === gateId ? processApproval(g, approved) : g));
      await executionEngineConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            approvalGates: gates,
            dashboard: { ...state.dashboard, waitingApproval: gates.filter((g) => g.status === "waiting-approval").length },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { gateId, approved };
    }
    case "recover": {
      const recoveryId = payload?.recoveryId ? String(payload.recoveryId) : undefined;
      if (recoveryId) {
        const updated = state.recoveries.map((r) => (r.id === recoveryId ? advanceRecovery(r) : r));
        await executionEngineConfigLifecycle.saveDraft(
          {
            ...live,
            settings: { ...state, recoveries: updated },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { recoveryId, advanced: true };
      }
      const issue = String(payload?.issue ?? "Workflow failure detected");
      const recovery = startRecovery(issue);
      await executionEngineConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            recoveries: [recovery, ...state.recoveries].slice(0, 15),
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { recoveryId: recovery.id };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidExecutionExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getExecutionEngineSnapshot();
      return { data: exportExecutionEngineSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
