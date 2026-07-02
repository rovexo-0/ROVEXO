import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { createDefaultAutomationSettings, createDefaultAutomationState } from "@/lib/enterprise-automation-hub/engine";
import { generateAutomationAiInsights } from "@/lib/enterprise-automation-hub/ai-integration";
import {
  ENTERPRISE_AUTOMATION_HUB_DRAFT_KEY,
  ENTERPRISE_AUTOMATION_HUB_HISTORY_KEY,
  ENTERPRISE_AUTOMATION_HUB_LIVE_KEY,
} from "@/lib/enterprise-automation-hub/keys";
import type { AutomationSettings, AutomationState } from "@/lib/enterprise-automation-hub/types";

export type AutomationFeatureFlags = Record<(typeof ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type AutomationConfigDocument = EnterpriseConfigDocument<AutomationSettings & AutomationState, AutomationFeatureFlags>;
export type AutomationConfigHistoryEntry = EnterpriseConfigHistoryEntry<AutomationConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): AutomationConfigDocument {
  const state = createDefaultAutomationState();
  const settings = createDefaultAutomationSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.featureFlags) as AutomationFeatureFlags,
    settings: { ...settings, ...state, aiInsights: generateAutomationAiInsights() },
    auditLog: [],
  };
}

function normalizeDocument(doc: AutomationConfigDocument): AutomationConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultAutomationState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      workflows: doc.settings?.workflows ?? defaultState.workflows,
      rules: doc.settings?.rules ?? defaultState.rules,
      eventTriggers: doc.settings?.eventTriggers ?? defaultState.eventTriggers,
      templates: doc.settings?.templates ?? defaultState.templates,
      schedules: doc.settings?.schedules ?? defaultState.schedules,
      executions: doc.settings?.executions ?? defaultState.executions,
      approvals: doc.settings?.approvals ?? defaultState.approvals,
      versions: doc.settings?.versions ?? defaultState.versions,
      aiInsights: doc.settings?.aiInsights ?? generateAutomationAiInsights(),
    },
    featureFlags: mergeFeatureFlags(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR, doc.featureFlags) as AutomationFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const automationConfigLifecycle = createConfigLifecycle<
  AutomationSettings & AutomationState,
  AutomationFeatureFlags,
  AutomationConfigHistoryEntry
>({
  moduleId: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_AUTOMATION_HUB_DRAFT_KEY,
  liveKey: ENTERPRISE_AUTOMATION_HUB_LIVE_KEY,
  historyKey: ENTERPRISE_AUTOMATION_HUB_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `automation-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getAutomationLiveDocument(): Promise<AutomationConfigDocument> {
  return automationConfigLifecycle.readLive();
}

export async function getAutomationDraftDocument(): Promise<AutomationConfigDocument> {
  return automationConfigLifecycle.getDraft();
}

export function detectAutomationPendingPublish(draft: AutomationConfigDocument, live: AutomationConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
