import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";
import { createDefaultHomepageCertificationSettings, createDefaultHomepageCertificationState } from "@/lib/homepage-enterprise-certification-engine/engine";
import {
  HOMEPAGE_CERTIFICATION_DRAFT_KEY,
  HOMEPAGE_CERTIFICATION_HISTORY_KEY,
  HOMEPAGE_CERTIFICATION_LIVE_KEY,
} from "@/lib/homepage-enterprise-certification-engine/keys";
import type { HomepageCertificationSettings, HomepageCertificationState } from "@/lib/homepage-enterprise-certification-engine/types";

export type HomepageCertificationFeatureFlags = Record<(typeof HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type HomepageCertificationConfigDocument = EnterpriseConfigDocument<HomepageCertificationSettings & HomepageCertificationState, HomepageCertificationFeatureFlags>;
export type HomepageCertificationConfigHistoryEntry = EnterpriseConfigHistoryEntry<HomepageCertificationConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): HomepageCertificationConfigDocument {
  const state = createDefaultHomepageCertificationState();
  const settings = createDefaultHomepageCertificationSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.featureFlags) as HomepageCertificationFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: HomepageCertificationConfigDocument): HomepageCertificationConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultHomepageCertificationState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      omegaScores: doc.settings?.omegaScores ?? defaultState.omegaScores,
      sections: doc.settings?.sections ?? defaultState.sections,
      buttons: doc.settings?.buttons ?? defaultState.buttons,
      search: doc.settings?.search ?? defaultState.search,
      categories: doc.settings?.categories ?? defaultState.categories,
      listings: doc.settings?.listings ?? defaultState.listings,
      responsive: doc.settings?.responsive ?? defaultState.responsive,
      performance: doc.settings?.performance ?? defaultState.performance,
      accessibility: doc.settings?.accessibility ?? defaultState.accessibility,
      seo: doc.settings?.seo ?? defaultState.seo,
      integrity: doc.settings?.integrity ?? defaultState.integrity,
      integrityScan: doc.settings?.integrityScan ?? defaultState.integrityScan,
      engineeringScan: doc.settings?.engineeringScan ?? defaultState.engineeringScan,
      duplicationFindings: doc.settings?.duplicationFindings ?? defaultState.duplicationFindings,
      layoutFindings: doc.settings?.layoutFindings ?? defaultState.layoutFindings,
      certificationRuns: doc.settings?.certificationRuns ?? defaultState.certificationRuns,
      failures: doc.settings?.failures ?? defaultState.failures,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
    },
    featureFlags: mergeFeatureFlags(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR, doc.featureFlags) as HomepageCertificationFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const homepageCertificationConfigLifecycle = createConfigLifecycle<
  HomepageCertificationSettings & HomepageCertificationState,
  HomepageCertificationFeatureFlags,
  HomepageCertificationConfigHistoryEntry
>({
  moduleId: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id,
  draftKey: HOMEPAGE_CERTIFICATION_DRAFT_KEY,
  liveKey: HOMEPAGE_CERTIFICATION_LIVE_KEY,
  historyKey: HOMEPAGE_CERTIFICATION_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `hp-cert-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getHomepageCertificationLiveDocument(): Promise<HomepageCertificationConfigDocument> {
  return homepageCertificationConfigLifecycle.readLive();
}

export async function getHomepageCertificationDraftDocument(): Promise<HomepageCertificationConfigDocument> {
  return homepageCertificationConfigLifecycle.getDraft();
}

export function detectHomepageCertificationPendingPublish(draft: HomepageCertificationConfigDocument, live: HomepageCertificationConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
