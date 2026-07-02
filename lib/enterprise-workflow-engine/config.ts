import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";
import {
  createDefaultWorkflowEngineSettings,
  createDefaultWorkflowEngineState,
  type WorkflowEngineState,
} from "@/lib/enterprise-workflow-engine/engine";
import {
  ENTERPRISE_WORKFLOW_ENGINE_DRAFT_KEY,
  ENTERPRISE_WORKFLOW_ENGINE_HISTORY_KEY,
  ENTERPRISE_WORKFLOW_ENGINE_LIVE_KEY,
} from "@/lib/enterprise-workflow-engine/keys";
import type { WorkflowEngineSettings } from "@/lib/enterprise-workflow-engine/types";

export type WorkflowEngineFeatureFlags = Record<
  (typeof WORKFLOW_ENGINE_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type WorkflowEngineConfigDocument = EnterpriseConfigDocument<
  WorkflowEngineSettings & WorkflowEngineState,
  WorkflowEngineFeatureFlags
>;

export type WorkflowEngineConfigHistoryEntry = EnterpriseConfigHistoryEntry<WorkflowEngineConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): WorkflowEngineConfigDocument {
  const state = createDefaultWorkflowEngineState();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      WORKFLOW_ENGINE_MODULE_DESCRIPTOR.featureFlags,
    ) as WorkflowEngineFeatureFlags,
    settings: { ...createDefaultWorkflowEngineSettings(), ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: WorkflowEngineConfigDocument): WorkflowEngineConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultWorkflowEngineState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      workflows: doc.settings?.workflows ?? defaultState.workflows,
      executions: doc.settings?.executions ?? defaultState.executions,
      schedules: doc.settings?.schedules ?? defaultState.schedules,
    },
    featureFlags: mergeFeatureFlags(
      WORKFLOW_ENGINE_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as WorkflowEngineFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const workflowEngineConfigLifecycle = createConfigLifecycle<
  WorkflowEngineSettings & WorkflowEngineState,
  WorkflowEngineFeatureFlags,
  WorkflowEngineConfigHistoryEntry
>({
  moduleId: WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_WORKFLOW_ENGINE_DRAFT_KEY,
  liveKey: ENTERPRISE_WORKFLOW_ENGINE_LIVE_KEY,
  historyKey: ENTERPRISE_WORKFLOW_ENGINE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `wfe-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getWorkflowEngineLiveDocument(): Promise<WorkflowEngineConfigDocument> {
  return workflowEngineConfigLifecycle.readLive();
}

export async function getWorkflowEngineDraftDocument(): Promise<WorkflowEngineConfigDocument> {
  return workflowEngineConfigLifecycle.getDraft();
}

export function detectWorkflowPendingPublish(
  draft: WorkflowEngineConfigDocument,
  live: WorkflowEngineConfigDocument,
): boolean {
  return JSON.stringify(draft.settings.workflows) !== JSON.stringify(live.settings.workflows);
}
