import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  createDefaultMarketplaceIntelligenceDocument,
  createDefaultMarketplaceIntelligenceHistory,
} from "@/lib/marketplace-intelligence/defaults";
import {
  MARKETPLACE_INTELLIGENCE_DRAFT_KEY,
  MARKETPLACE_INTELLIGENCE_HISTORY_KEY,
  MARKETPLACE_INTELLIGENCE_LIVE_KEY,
} from "@/lib/marketplace-intelligence/keys";
import type {
  MarketplaceIntelligenceDocument,
  MarketplaceIntelligenceHistoryEntry,
} from "@/lib/marketplace-intelligence/types";

function normalizeDocument(doc: MarketplaceIntelligenceDocument): MarketplaceIntelligenceDocument {
  const defaults = createDefaultMarketplaceIntelligenceDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    thresholds: { ...defaults.thresholds, ...doc.thresholds },
    rankingWeights: { ...defaults.rankingWeights, ...doc.rankingWeights },
    modules: doc.modules ?? defaults.modules,
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveMarketplaceIntelligenceDocument(): Promise<MarketplaceIntelligenceDocument> {
  const doc = await getPlatformSetting<MarketplaceIntelligenceDocument>(
    MARKETPLACE_INTELLIGENCE_LIVE_KEY,
    createDefaultMarketplaceIntelligenceDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getMarketplaceIntelligenceDraft(): Promise<MarketplaceIntelligenceDocument> {
  const live = await readLiveMarketplaceIntelligenceDocument();
  const draft = await getPlatformSetting<MarketplaceIntelligenceDocument>(MARKETPLACE_INTELLIGENCE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getMarketplaceIntelligenceHistory(): Promise<MarketplaceIntelligenceHistoryEntry[]> {
  return getPlatformSetting(MARKETPLACE_INTELLIGENCE_HISTORY_KEY, createDefaultMarketplaceIntelligenceHistory());
}

export async function getMarketplaceIntelligenceSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getMarketplaceIntelligenceDraft(),
    readLiveMarketplaceIntelligenceDocument(),
    getMarketplaceIntelligenceHistory(),
  ]);
  return { draft, live, history };
}

export async function saveMarketplaceIntelligenceDraft(
  document: MarketplaceIntelligenceDocument,
  actorId: string,
): Promise<MarketplaceIntelligenceDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      { at: new Date().toISOString(), action: "save-draft", actor: actorId },
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({
    actorId,
    key: MARKETPLACE_INTELLIGENCE_DRAFT_KEY,
    value: next as unknown as Json,
  });
  return next;
}

export async function publishMarketplaceIntelligence(actorId: string): Promise<MarketplaceIntelligenceDocument> {
  const [draft, live, history] = await Promise.all([
    getMarketplaceIntelligenceDraft(),
    readLiveMarketplaceIntelligenceDocument(),
    getMarketplaceIntelligenceHistory(),
  ]);

  const historyEntry: MarketplaceIntelligenceHistoryEntry = {
    id: `mi-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({
    ...draft,
    label: "Live",
    updatedAt: new Date().toISOString(),
    auditLog: [
      { at: new Date().toISOString(), action: "publish", actor: actorId },
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: MARKETPLACE_INTELLIGENCE_LIVE_KEY,
      value: published as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MARKETPLACE_INTELLIGENCE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 50) as unknown as Json,
    }),
  ]);

  return published;
}

export async function updateMarketplaceIntelligenceThresholds(
  thresholds: Partial<MarketplaceIntelligenceDocument["thresholds"]>,
  actorId: string,
): Promise<MarketplaceIntelligenceDocument> {
  const draft = await getMarketplaceIntelligenceDraft();
  return saveMarketplaceIntelligenceDraft(
    { ...draft, thresholds: { ...draft.thresholds, ...thresholds } },
    actorId,
  );
}
