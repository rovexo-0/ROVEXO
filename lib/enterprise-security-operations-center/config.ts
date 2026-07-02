import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { createDefaultSocSettings, createDefaultSocState } from "@/lib/enterprise-security-operations-center/engine";
import {
  ENTERPRISE_SOC_DRAFT_KEY,
  ENTERPRISE_SOC_HISTORY_KEY,
  ENTERPRISE_SOC_LIVE_KEY,
} from "@/lib/enterprise-security-operations-center/keys";
import type { SocSettings, SocState } from "@/lib/enterprise-security-operations-center/types";

export type SocFeatureFlags = Record<
  (typeof ENTERPRISE_SOC_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type SocConfigDocument = EnterpriseConfigDocument<SocSettings & SocState, SocFeatureFlags>;
export type SocConfigHistoryEntry = EnterpriseConfigHistoryEntry<SocConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): SocConfigDocument {
  const state = createDefaultSocState();
  const settings = createDefaultSocSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(ENTERPRISE_SOC_MODULE_DESCRIPTOR.featureFlags) as SocFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: SocConfigDocument): SocConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultSocState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      events: doc.settings?.events ?? defaultState.events,
      threats: doc.settings?.threats ?? defaultState.threats,
      intrusions: doc.settings?.intrusions ?? defaultState.intrusions,
      scannerResults: doc.settings?.scannerResults ?? defaultState.scannerResults,
      firewallRules: doc.settings?.firewallRules ?? defaultState.firewallRules,
      devices: doc.settings?.devices ?? defaultState.devices,
      sessions: doc.settings?.sessions ?? defaultState.sessions,
      vulnerabilities: doc.settings?.vulnerabilities ?? defaultState.vulnerabilities,
      aiInsights: doc.settings?.aiInsights ?? defaultState.aiInsights,
      automations: doc.settings?.automations ?? defaultState.automations,
      auditTimeline: doc.settings?.auditTimeline ?? defaultState.auditTimeline,
    },
    featureFlags: mergeFeatureFlags(ENTERPRISE_SOC_MODULE_DESCRIPTOR, doc.featureFlags) as SocFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const socConfigLifecycle = createConfigLifecycle<SocSettings & SocState, SocFeatureFlags, SocConfigHistoryEntry>({
  moduleId: ENTERPRISE_SOC_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_SOC_DRAFT_KEY,
  liveKey: ENTERPRISE_SOC_LIVE_KEY,
  historyKey: ENTERPRISE_SOC_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `soc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_SOC_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_SOC_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getSocLiveDocument(): Promise<SocConfigDocument> {
  return socConfigLifecycle.readLive();
}

export async function getSocDraftDocument(): Promise<SocConfigDocument> {
  return socConfigLifecycle.getDraft();
}

export function detectSocPendingPublish(draft: SocConfigDocument, live: SocConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
