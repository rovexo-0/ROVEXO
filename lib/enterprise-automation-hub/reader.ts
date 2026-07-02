import type { AutomationSnapshot, AutomationTab } from "@/lib/enterprise-automation-hub/types";
import {
  detectAutomationPendingPublish,
  getAutomationDraftDocument,
  getAutomationLiveDocument,
  automationConfigLifecycle,
} from "@/lib/enterprise-automation-hub/config";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { buildAutomationDashboard, createDefaultAutomationSettings } from "@/lib/enterprise-automation-hub/engine";

export async function getAutomationSnapshot(tab: AutomationTab = "dashboard"): Promise<AutomationSnapshot> {
  const live = await getAutomationLiveDocument();
  const draft = await getAutomationDraftDocument();
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
  const settings = { ...createDefaultAutomationSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_automation_hub_v1 !== false;
  const state = { workflows, rules, eventTriggers, templates, schedules, executions, approvals, versions, aiInsights };
  const dashboard = buildAutomationDashboard(state);
  const history = await automationConfigLifecycle.getHistory();
  const healthScore = enabled ? dashboard.automationHealth : 0;

  return {
    tab,
    dashboard,
    workflows: flags.workflow_builder_enabled !== false ? workflows : [],
    rules: flags.rule_engine_enabled !== false ? rules : [],
    eventTriggers: flags.event_triggers_enabled !== false ? eventTriggers : [],
    templates,
    schedules: flags.scheduler_enabled !== false ? schedules : [],
    executions,
    approvals: flags.approval_workflows_enabled !== false ? approvals : [],
    versions,
    aiInsights: flags.ai_automation_enabled !== false ? aiInsights : [],
    settings,
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectAutomationPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Enterprise Automation Hub operational" : "Automation Hub disabled",
    },
  };
}

export async function getAutomationPageData(tab: AutomationTab = "dashboard") {
  const snapshot = await getAutomationSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR };
}

export function validateAutomationReadiness(snapshot: AutomationSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_automation_hub_v1 !== false,
    snapshot.workflows.length > 0,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
