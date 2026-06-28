import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";
import { createDefaultExecutionEngineSettings, createDefaultExecutionEngineState } from "@/lib/enterprise-autonomous-execution-engine/engine";
import {
  EXECUTION_ENGINE_DRAFT_KEY,
  EXECUTION_ENGINE_HISTORY_KEY,
  EXECUTION_ENGINE_LIVE_KEY,
} from "@/lib/enterprise-autonomous-execution-engine/keys";
import type { ExecutionEngineSettings, ExecutionEngineState } from "@/lib/enterprise-autonomous-execution-engine/types";

export type ExecutionEngineFeatureFlags = Record<(typeof EXECUTION_ENGINE_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type ExecutionEngineConfigDocument = EnterpriseConfigDocument<ExecutionEngineSettings & ExecutionEngineState, ExecutionEngineFeatureFlags>;
export type ExecutionEngineConfigHistoryEntry = EnterpriseConfigHistoryEntry<ExecutionEngineConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): ExecutionEngineConfigDocument {
  const state = createDefaultExecutionEngineState();
  const settings = createDefaultExecutionEngineSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(EXECUTION_ENGINE_MODULE_DESCRIPTOR.featureFlags) as ExecutionEngineFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: ExecutionEngineConfigDocument): ExecutionEngineConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultExecutionEngineState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      coordinations: doc.settings?.coordinations ?? defaultState.coordinations,
      workflows: doc.settings?.workflows ?? defaultState.workflows,
      tasks: doc.settings?.tasks ?? defaultState.tasks,
      priorityScores: doc.settings?.priorityScores ?? defaultState.priorityScores,
      pipeline: doc.settings?.pipeline ?? defaultState.pipeline,
      approvalGates: doc.settings?.approvalGates ?? defaultState.approvalGates,
      recoveries: doc.settings?.recoveries ?? defaultState.recoveries,
      decisions: doc.settings?.decisions ?? defaultState.decisions,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(EXECUTION_ENGINE_MODULE_DESCRIPTOR, doc.featureFlags) as ExecutionEngineFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const executionEngineConfigLifecycle = createConfigLifecycle<
  ExecutionEngineSettings & ExecutionEngineState,
  ExecutionEngineFeatureFlags,
  ExecutionEngineConfigHistoryEntry
>({
  moduleId: EXECUTION_ENGINE_MODULE_DESCRIPTOR.id,
  draftKey: EXECUTION_ENGINE_DRAFT_KEY,
  liveKey: EXECUTION_ENGINE_LIVE_KEY,
  historyKey: EXECUTION_ENGINE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `exe-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: EXECUTION_ENGINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: EXECUTION_ENGINE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getExecutionEngineLiveDocument(): Promise<ExecutionEngineConfigDocument> {
  return executionEngineConfigLifecycle.readLive();
}

export async function getExecutionEngineDraftDocument(): Promise<ExecutionEngineConfigDocument> {
  return executionEngineConfigLifecycle.getDraft();
}

export function detectExecutionEnginePendingPublish(draft: ExecutionEngineConfigDocument, live: ExecutionEngineConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
