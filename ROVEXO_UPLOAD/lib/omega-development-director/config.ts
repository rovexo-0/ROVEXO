import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";
import { createDefaultDevDirectorSettings, createDefaultDevDirectorState } from "@/lib/omega-development-director/engine";
import {
  OMEGA_DEV_DIRECTOR_DRAFT_KEY,
  OMEGA_DEV_DIRECTOR_HISTORY_KEY,
  OMEGA_DEV_DIRECTOR_LIVE_KEY,
} from "@/lib/omega-development-director/keys";
import type { DevDirectorSettings, DevDirectorState } from "@/lib/omega-development-director/types";

export type DevDirectorFeatureFlags = Record<(typeof OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type DevDirectorConfigDocument = EnterpriseConfigDocument<DevDirectorSettings & DevDirectorState, DevDirectorFeatureFlags>;
export type DevDirectorConfigHistoryEntry = EnterpriseConfigHistoryEntry<DevDirectorConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): DevDirectorConfigDocument {
  const state = createDefaultDevDirectorState();
  const settings = createDefaultDevDirectorSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.featureFlags) as DevDirectorFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: DevDirectorConfigDocument): DevDirectorConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultDevDirectorState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      boardMetrics: doc.settings?.boardMetrics ?? defaultState.boardMetrics,
      codeAnalysis: doc.settings?.codeAnalysis ?? defaultState.codeAnalysis,
      discoveries: doc.settings?.discoveries ?? defaultState.discoveries,
      implementations: doc.settings?.implementations ?? defaultState.implementations,
      roadmap: doc.settings?.roadmap ?? defaultState.roadmap,
      dependencyGraph: doc.settings?.dependencyGraph ?? defaultState.dependencyGraph,
      pipeline: doc.settings?.pipeline ?? defaultState.pipeline,
      repairProposals: doc.settings?.repairProposals ?? defaultState.repairProposals,
      insights: doc.settings?.insights ?? defaultState.insights,
      coordinations: doc.settings?.coordinations ?? defaultState.coordinations,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR, doc.featureFlags) as DevDirectorFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const devDirectorConfigLifecycle = createConfigLifecycle<
  DevDirectorSettings & DevDirectorState,
  DevDirectorFeatureFlags,
  DevDirectorConfigHistoryEntry
>({
  moduleId: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id,
  draftKey: OMEGA_DEV_DIRECTOR_DRAFT_KEY,
  liveKey: OMEGA_DEV_DIRECTOR_LIVE_KEY,
  historyKey: OMEGA_DEV_DIRECTOR_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `odd-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getDevDirectorLiveDocument(): Promise<DevDirectorConfigDocument> {
  return devDirectorConfigLifecycle.readLive();
}

export async function getDevDirectorDraftDocument(): Promise<DevDirectorConfigDocument> {
  return devDirectorConfigLifecycle.getDraft();
}

export function detectDevDirectorPendingPublish(draft: DevDirectorConfigDocument, live: DevDirectorConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
