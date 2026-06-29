import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR } from "@/lib/enterprise-marketplace-completion-engine/descriptor";
import { createDefaultMarketplaceCompletionSettings } from "@/lib/enterprise-marketplace-completion-engine/engine";
import { createPendingMarketplaceCompletionState } from "@/lib/enterprise-marketplace-completion-engine/pending-state";
import {
  MARKETPLACE_COMPLETION_DRAFT_KEY,
  MARKETPLACE_COMPLETION_HISTORY_KEY,
  MARKETPLACE_COMPLETION_LIVE_KEY,
} from "@/lib/enterprise-marketplace-completion-engine/keys";
import type { MarketplaceCompletionSettings, MarketplaceCompletionState } from "@/lib/enterprise-marketplace-completion-engine/types";

export type MarketplaceCompletionFeatureFlags = Record<(typeof MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.featureFlags)[number]["id"], boolean>;
export type MarketplaceCompletionConfigDocument = EnterpriseConfigDocument<MarketplaceCompletionSettings & MarketplaceCompletionState, MarketplaceCompletionFeatureFlags>;
export type MarketplaceCompletionConfigHistoryEntry = EnterpriseConfigHistoryEntry<MarketplaceCompletionConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): MarketplaceCompletionConfigDocument {
  const state = createPendingMarketplaceCompletionState();
  const settings = createDefaultMarketplaceCompletionSettings();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.featureFlags) as MarketplaceCompletionFeatureFlags,
    settings: { ...settings, ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: MarketplaceCompletionConfigDocument): MarketplaceCompletionConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createPendingMarketplaceCompletionState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      dashboard: doc.settings?.dashboard ?? defaultState.dashboard,
      scores: doc.settings?.scores ?? defaultState.scores,
      modules: doc.settings?.modules ?? defaultState.modules,
      moduleCompletion: doc.settings?.moduleCompletion ?? defaultState.moduleCompletion,
      buttons: doc.settings?.buttons ?? defaultState.buttons,
      routes: doc.settings?.routes ?? defaultState.routes,
      buyerJourney: doc.settings?.buyerJourney ?? defaultState.buyerJourney,
      sellerJourney: doc.settings?.sellerJourney ?? defaultState.sellerJourney,
      companyJourney: doc.settings?.companyJourney ?? defaultState.companyJourney,
      homepage: doc.settings?.homepage ?? defaultState.homepage,
      search: doc.settings?.search ?? defaultState.search,
      categories: doc.settings?.categories ?? defaultState.categories,
      listings: doc.settings?.listings ?? defaultState.listings,
      uiIntegrity: doc.settings?.uiIntegrity ?? defaultState.uiIntegrity,
      completionScan: doc.settings?.completionScan ?? defaultState.completionScan,
      productionGates: doc.settings?.productionGates ?? defaultState.productionGates,
      blockers: doc.settings?.blockers ?? defaultState.blockers,
      repairActions: doc.settings?.repairActions ?? defaultState.repairActions,
      reports: doc.settings?.reports ?? defaultState.reports,
      auditEntries: doc.settings?.auditEntries ?? defaultState.auditEntries,
      intelligence: doc.settings?.intelligence ?? defaultState.intelligence,
      consistency: doc.settings?.consistency ?? defaultState.consistency,
      cleanup: doc.settings?.cleanup ?? defaultState.cleanup,
      modernization: doc.settings?.modernization ?? defaultState.modernization,
      healthScores: doc.settings?.healthScores ?? defaultState.healthScores,
      continuousImprovement: doc.settings?.continuousImprovement ?? defaultState.continuousImprovement,
      finalRules: doc.settings?.finalRules ?? defaultState.finalRules,
      director: doc.settings?.director ?? defaultState.director,
      certificationGate: doc.settings?.certificationGate ?? defaultState.certificationGate,
      launchMode: doc.settings?.launchMode ?? defaultState.launchMode,
      zeroDefect: doc.settings?.zeroDefect ?? defaultState.zeroDefect,
      executionRelease: doc.settings?.executionRelease ?? defaultState.executionRelease,
      enterpriseDelivery: doc.settings?.enterpriseDelivery ?? defaultState.enterpriseDelivery,
      executionMode: doc.settings?.executionMode ?? defaultState.executionMode,
      homepageCompletion: doc.settings?.homepageCompletion ?? defaultState.homepageCompletion,
      categoryCompletion: doc.settings?.categoryCompletion ?? defaultState.categoryCompletion,
      searchCompletion: doc.settings?.searchCompletion ?? defaultState.searchCompletion,
      listingCompletion: doc.settings?.listingCompletion ?? defaultState.listingCompletion,
      buyerCompletion: doc.settings?.buyerCompletion ?? defaultState.buyerCompletion,
      checkoutCompletion: doc.settings?.checkoutCompletion ?? defaultState.checkoutCompletion,
      orderCompletion: doc.settings?.orderCompletion ?? defaultState.orderCompletion,
      shippingCompletion: doc.settings?.shippingCompletion ?? defaultState.shippingCompletion,
      communicationCompletion: doc.settings?.communicationCompletion ?? defaultState.communicationCompletion,
    },
    featureFlags: mergeFeatureFlags(MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR, doc.featureFlags) as MarketplaceCompletionFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const marketplaceCompletionConfigLifecycle = createConfigLifecycle<
  MarketplaceCompletionSettings & MarketplaceCompletionState,
  MarketplaceCompletionFeatureFlags,
  MarketplaceCompletionConfigHistoryEntry
>({
  moduleId: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id,
  draftKey: MARKETPLACE_COMPLETION_DRAFT_KEY,
  liveKey: MARKETPLACE_COMPLETION_LIVE_KEY,
  historyKey: MARKETPLACE_COMPLETION_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `mc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getMarketplaceCompletionLiveDocument(): Promise<MarketplaceCompletionConfigDocument> {
  return marketplaceCompletionConfigLifecycle.readLive();
}

export async function getMarketplaceCompletionDraftDocument(): Promise<MarketplaceCompletionConfigDocument> {
  return marketplaceCompletionConfigLifecycle.getDraft();
}

export function detectMarketplaceCompletionPendingPublish(draft: MarketplaceCompletionConfigDocument, live: MarketplaceCompletionConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
