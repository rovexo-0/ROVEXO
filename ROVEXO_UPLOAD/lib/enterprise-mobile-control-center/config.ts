import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import {
  createDefaultMobileCcSettings,
  createDefaultMobileCcState,
} from "@/lib/enterprise-mobile-control-center/engine";
import {
  ENTERPRISE_MOBILE_CC_DRAFT_KEY,
  ENTERPRISE_MOBILE_CC_HISTORY_KEY,
  ENTERPRISE_MOBILE_CC_LIVE_KEY,
} from "@/lib/enterprise-mobile-control-center/keys";
import type { MobileCcSettings, MobileCcState } from "@/lib/enterprise-mobile-control-center/types";

export type MobileCcFeatureFlags = Record<
  (typeof ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type MobileCcConfigDocument = EnterpriseConfigDocument<
  MobileCcSettings & MobileCcState,
  MobileCcFeatureFlags
>;

export type MobileCcConfigHistoryEntry = EnterpriseConfigHistoryEntry<MobileCcConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): MobileCcConfigDocument {
  const state = createDefaultMobileCcState();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.featureFlags,
    ) as MobileCcFeatureFlags,
    settings: { ...createDefaultMobileCcSettings(), ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: MobileCcConfigDocument): MobileCcConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultMobileCcState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      builds: doc.settings?.builds ?? defaultState.builds,
      releases: doc.settings?.releases ?? defaultState.releases,
      devices: doc.settings?.devices ?? defaultState.devices,
      downloads: doc.settings?.downloads ?? defaultState.downloads,
      otaUpdates: doc.settings?.otaUpdates ?? defaultState.otaUpdates,
      pushCampaigns: doc.settings?.pushCampaigns ?? defaultState.pushCampaigns,
      buildHistory: doc.settings?.buildHistory ?? defaultState.buildHistory,
      aiInsights: doc.settings?.aiInsights ?? defaultState.aiInsights,
      aiSuggestions: doc.settings?.aiSuggestions ?? defaultState.aiSuggestions,
    },
    featureFlags: mergeFeatureFlags(
      ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as MobileCcFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const mobileCcConfigLifecycle = createConfigLifecycle<
  MobileCcSettings & MobileCcState,
  MobileCcFeatureFlags,
  MobileCcConfigHistoryEntry
>({
  moduleId: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_MOBILE_CC_DRAFT_KEY,
  liveKey: ENTERPRISE_MOBILE_CC_LIVE_KEY,
  historyKey: ENTERPRISE_MOBILE_CC_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `mcc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getMobileCcLiveDocument(): Promise<MobileCcConfigDocument> {
  return mobileCcConfigLifecycle.readLive();
}

export async function getMobileCcDraftDocument(): Promise<MobileCcConfigDocument> {
  return mobileCcConfigLifecycle.getDraft();
}

export function detectMobileCcPendingPublish(draft: MobileCcConfigDocument, live: MobileCcConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
