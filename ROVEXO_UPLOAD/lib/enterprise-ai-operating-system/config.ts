import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import {
  createDefaultAiOsSettings,
  createDefaultAiOsState,
} from "@/lib/enterprise-ai-operating-system/engine";
import {
  ENTERPRISE_AI_OS_DRAFT_KEY,
  ENTERPRISE_AI_OS_HISTORY_KEY,
  ENTERPRISE_AI_OS_LIVE_KEY,
} from "@/lib/enterprise-ai-operating-system/keys";
import type { AiOsSettings, AiOsState } from "@/lib/enterprise-ai-operating-system/types";

export type AiOsFeatureFlags = Record<
  (typeof ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type AiOsConfigDocument = EnterpriseConfigDocument<
  AiOsSettings & AiOsState,
  AiOsFeatureFlags
>;

export type AiOsConfigHistoryEntry = EnterpriseConfigHistoryEntry<AiOsConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): AiOsConfigDocument {
  const state = createDefaultAiOsState();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.featureFlags,
    ) as AiOsFeatureFlags,
    settings: { ...createDefaultAiOsSettings(), ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: AiOsConfigDocument): AiOsConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultAiOsState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      scans: doc.settings?.scans ?? defaultState.scans,
      alerts: doc.settings?.alerts ?? defaultState.alerts,
      recommendations: doc.settings?.recommendations ?? defaultState.recommendations,
      predictions: doc.settings?.predictions ?? defaultState.predictions,
      repairs: doc.settings?.repairs ?? defaultState.repairs,
      models: doc.settings?.models ?? defaultState.models,
      incidents: doc.settings?.incidents ?? defaultState.incidents,
    },
    featureFlags: mergeFeatureFlags(
      ENTERPRISE_AI_OS_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as AiOsFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const aiOsConfigLifecycle = createConfigLifecycle<
  AiOsSettings & AiOsState,
  AiOsFeatureFlags,
  AiOsConfigHistoryEntry
>({
  moduleId: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_AI_OS_DRAFT_KEY,
  liveKey: ENTERPRISE_AI_OS_LIVE_KEY,
  historyKey: ENTERPRISE_AI_OS_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `aios-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getAiOsLiveDocument(): Promise<AiOsConfigDocument> {
  return aiOsConfigLifecycle.readLive();
}

export async function getAiOsDraftDocument(): Promise<AiOsConfigDocument> {
  return aiOsConfigLifecycle.getDraft();
}

export function detectAiOsPendingPublish(draft: AiOsConfigDocument, live: AiOsConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
