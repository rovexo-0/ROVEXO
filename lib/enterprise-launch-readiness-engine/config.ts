import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { LAUNCH_READINESS_MODULE_DESCRIPTOR } from "@/lib/enterprise-launch-readiness-engine/descriptor";
import { createDefaultLaunchReadinessSettings, createDefaultLaunchReadinessState } from "@/lib/enterprise-launch-readiness-engine/engine";
import {
  LAUNCH_READINESS_DRAFT_KEY,
  LAUNCH_READINESS_HISTORY_KEY,
  LAUNCH_READINESS_LIVE_KEY,
} from "@/lib/enterprise-launch-readiness-engine/keys";
import type { LaunchReadinessSettings, LaunchReadinessState } from "@/lib/enterprise-launch-readiness-engine/types";

export type LaunchReadinessFeatureFlags = Record<(typeof LAUNCH_READINESS_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type LaunchReadinessConfigDocument = EnterpriseConfigDocument<LaunchReadinessSettings & LaunchReadinessState, LaunchReadinessFeatureFlags>;
export type LaunchReadinessConfigHistoryEntry = EnterpriseConfigHistoryEntry<LaunchReadinessConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): LaunchReadinessConfigDocument {
  const state = createDefaultLaunchReadinessState();
  const settings = createDefaultLaunchReadinessSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(LAUNCH_READINESS_MODULE_DESCRIPTOR.featureFlags) as LaunchReadinessFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: LaunchReadinessConfigDocument): LaunchReadinessConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultLaunchReadinessState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      scores: doc.settings?.scores ?? defaultState.scores,
      email: doc.settings?.email ?? defaultState.email,
      cron: doc.settings?.cron ?? defaultState.cron,
      queue: doc.settings?.queue ?? defaultState.queue,
      pwa: doc.settings?.pwa ?? defaultState.pwa,
      push: doc.settings?.push ?? defaultState.push,
      healthChecks: doc.settings?.healthChecks ?? defaultState.healthChecks,
      performance: doc.settings?.performance ?? defaultState.performance,
      caching: doc.settings?.caching ?? defaultState.caching,
      database: doc.settings?.database ?? defaultState.database,
      searchIndex: doc.settings?.searchIndex ?? defaultState.searchIndex,
      seo: doc.settings?.seo ?? defaultState.seo,
      security: doc.settings?.security ?? defaultState.security,
      storage: doc.settings?.storage ?? defaultState.storage,
      deployment: doc.settings?.deployment ?? defaultState.deployment,
      monitoring: doc.settings?.monitoring ?? defaultState.monitoring,
      launchScan: doc.settings?.launchScan ?? defaultState.launchScan,
      productionGates: doc.settings?.productionGates ?? defaultState.productionGates,
      blockers: doc.settings?.blockers ?? defaultState.blockers,
      repairActions: doc.settings?.repairActions ?? defaultState.repairActions,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(LAUNCH_READINESS_MODULE_DESCRIPTOR, doc.featureFlags) as LaunchReadinessFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const launchReadinessConfigLifecycle = createConfigLifecycle<
  LaunchReadinessSettings & LaunchReadinessState,
  LaunchReadinessFeatureFlags,
  LaunchReadinessConfigHistoryEntry
>({
  moduleId: LAUNCH_READINESS_MODULE_DESCRIPTOR.id,
  draftKey: LAUNCH_READINESS_DRAFT_KEY,
  liveKey: LAUNCH_READINESS_LIVE_KEY,
  historyKey: LAUNCH_READINESS_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `lr-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: LAUNCH_READINESS_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: LAUNCH_READINESS_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getLaunchReadinessLiveDocument(): Promise<LaunchReadinessConfigDocument> {
  return launchReadinessConfigLifecycle.readLive();
}

export async function getLaunchReadinessDraftDocument(): Promise<LaunchReadinessConfigDocument> {
  return launchReadinessConfigLifecycle.getDraft();
}

export function detectLaunchReadinessPendingPublish(draft: LaunchReadinessConfigDocument, live: LaunchReadinessConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
