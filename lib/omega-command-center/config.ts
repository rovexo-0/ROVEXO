import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import {
  computeEnterpriseScore,
  createDefaultEngineStates,
  createDefaultRecommendations,
  createDefaultTimeline,
  createEnterpriseHealthCards,
  createExecutiveReport,
  createLiveMonitorReadings,
  createOmegaSettings,
  runFullEnterpriseScanPipeline,
  startEnterpriseScan,
} from "@/lib/omega-command-center/orchestrator";
import {
  OMEGA_COMMAND_CENTER_DRAFT_KEY,
  OMEGA_COMMAND_CENTER_HISTORY_KEY,
  OMEGA_COMMAND_CENTER_LIVE_KEY,
} from "@/lib/omega-command-center/keys";
import type { OmegaDashboard, OmegaSettings } from "@/lib/omega-command-center/types";

export type OmegaFeatureFlags = Record<(typeof OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type OmegaConfigDocument = EnterpriseConfigDocument<OmegaSettings & OmegaDashboard, OmegaFeatureFlags>;
export type OmegaConfigHistoryEntry = EnterpriseConfigHistoryEntry<OmegaConfigDocument>;

function buildDefaultDashboard(): OmegaDashboard {
  const healthCards = createEnterpriseHealthCards();
  const enterpriseScore = computeEnterpriseScore(healthCards);
  return {
    enterpriseScore,
    healthCards,
    engineStates: createDefaultEngineStates(),
    recommendations: createDefaultRecommendations(),
    executiveReport: createExecutiveReport(enterpriseScore),
    timeline: createDefaultTimeline(),
    liveMonitor: createLiveMonitorReadings(),
  };
}

function createDefaultDocument(label: "Draft" | "Live"): OmegaConfigDocument {
  const settings = createOmegaSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.featureFlags) as OmegaFeatureFlags,
    settings: { ...settings, ...buildDefaultDashboard() },
    auditLog: [],
  };
}

function normalizeDocument(doc: OmegaConfigDocument): OmegaConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultDashboard = buildDefaultDashboard();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      enterpriseScore: doc.settings?.enterpriseScore ?? defaultDashboard.enterpriseScore,
      healthCards: doc.settings?.healthCards ?? defaultDashboard.healthCards,
      engineStates: doc.settings?.engineStates ?? defaultDashboard.engineStates,
      recommendations: doc.settings?.recommendations ?? defaultDashboard.recommendations,
      executiveReport: doc.settings?.executiveReport ?? defaultDashboard.executiveReport,
      timeline: doc.settings?.timeline ?? defaultDashboard.timeline,
      liveMonitor: doc.settings?.liveMonitor ?? defaultDashboard.liveMonitor,
      activeScan: doc.settings?.activeScan,
    },
    featureFlags: mergeFeatureFlags(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR, doc.featureFlags) as OmegaFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const omegaConfigLifecycle = createConfigLifecycle<
  OmegaSettings & OmegaDashboard,
  OmegaFeatureFlags,
  OmegaConfigHistoryEntry
>({
  moduleId: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id,
  draftKey: OMEGA_COMMAND_CENTER_DRAFT_KEY,
  liveKey: OMEGA_COMMAND_CENTER_LIVE_KEY,
  historyKey: OMEGA_COMMAND_CENTER_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `omega-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getOmegaLiveDocument(): Promise<OmegaConfigDocument> {
  return omegaConfigLifecycle.readLive();
}

export async function getOmegaDraftDocument(): Promise<OmegaConfigDocument> {
  return omegaConfigLifecycle.getDraft();
}

export function detectOmegaPendingPublish(draft: OmegaConfigDocument, live: OmegaConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}

export { startEnterpriseScan, runFullEnterpriseScanPipeline, buildDefaultDashboard };
