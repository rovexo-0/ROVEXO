import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformAutomationAction } from "@/lib/enterprise-automation-hub/audit";
import { getAutomationLiveDocument, automationConfigLifecycle } from "@/lib/enterprise-automation-hub/config";
import { executeAutomationConfigAction, isAutomationConfigAction } from "@/lib/enterprise-automation-hub/config-actions";
import type { AutomationConfigDocument } from "@/lib/enterprise-automation-hub/config";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { refreshAutomationState } from "@/lib/enterprise-automation-hub/engine";
import { generateAutomationAiInsights } from "@/lib/enterprise-automation-hub/ai-integration";
import { exportAutomationSnapshot, isValidAutomationExportFormat, parseAutomationImportPayload } from "@/lib/enterprise-automation-hub/export";

export async function executeAutomationAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isAutomationConfigAction(action)) {
    return executeAutomationConfigAction(action, actorId, payload as { document?: AutomationConfigDocument; historyId?: string });
  }

  const permission = canPerformAutomationAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getAutomationLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id,
    action,
  });

  const {
    workflows,
    rules,
    eventTriggers,
    templates,
    schedules,
    executions,
    approvals,
    versions,
    aiInsights,
    ...settingsFields
  } = live.settings;

  const state = { workflows, rules, eventTriggers, templates, schedules, executions, approvals, versions, aiInsights };

  switch (action) {
    case "refresh": {
      const refreshed = refreshAutomationState(state);
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, ...refreshed }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { refreshed: true };
    }
    case "run": {
      const workflowId = String(payload?.workflowId ?? workflows[0]?.id ?? "");
      const newExecution = {
        id: `exec-${Date.now()}`,
        workflowId,
        workflowVersion: workflows.find((w) => w.id === workflowId)?.version ?? "1.0.0",
        triggeredBy: "manual",
        status: "running" as const,
        durationMs: 0,
        startedAt: new Date().toISOString(),
        rollbackAvailable: false,
      };
      await automationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...live.settings, executions: [newExecution, ...executions].slice(0, 50) },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { executionId: newExecution.id };
    }
    case "pause":
    case "stop": {
      const updated = executions.map((e) =>
        e.status === "running" ? { ...e, status: action === "pause" ? ("paused" as const) : ("stopped" as const), completedAt: new Date().toISOString() } : e,
      );
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, executions: updated }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { [action]: true };
    }
    case "enable":
    case "disable": {
      const enabled = action === "enable";
      const workflowId = String(payload?.workflowId ?? "");
      const updatedWorkflows = workflows.map((w) =>
        !workflowId || w.id === workflowId ? { ...w, enabled, status: enabled ? ("enabled" as const) : ("disabled" as const) } : w,
      );
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, workflows: updatedWorkflows }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { [action]: true };
    }
    case "publish": {
      const approvalId = String(payload?.approvalId ?? "");
      const updatedApprovals = approvals.map((a) =>
        !approvalId || a.id === approvalId ? { ...a, status: "published" as const, reviewedBy: actorId } : a,
      );
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, approvals: updatedApprovals }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { published: true };
    }
    case "rollback": {
      const versionId = String(payload?.versionId ?? versions[0]?.id ?? "");
      const rolled = versions.map((v) => (v.id === versionId ? { ...v, rollbackAvailable: false } : v));
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, versions: rolled }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { rollback: true };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidAutomationExportFormat(format)) throw new Error("Invalid export format");
      return { data: exportAutomationSnapshot(
        {
          tab: "dashboard",
          dashboard: { activeWorkflows: 0, runningJobs: 0, scheduledJobs: 0, pausedJobs: 0, failedJobs: 0, aiAutomations: 0, approvalQueue: 0, averageExecutionTimeMs: 0, successRate: 0, rollbackQueue: 0, automationHealth: 0 },
          ...state,
          settings: settingsFields,
          history: [],
          auditLog: [],
          featureFlagsConfig: live.featureFlags,
          pendingPublish: false,
          health: { status: "healthy", score: 100, message: "ok" },
        },
        format,
      ) };
    }
    case "import": {
      const raw = String(payload?.data ?? "{}");
      const parsed = parseAutomationImportPayload(raw);
      await automationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...live.settings,
            workflows: parsed.workflows ?? workflows,
            rules: parsed.rules ?? rules,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { imported: true };
    }
    case "generate-ai-insights": {
      const insights = generateAutomationAiInsights();
      await automationConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, aiInsights: insights }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { insights };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
