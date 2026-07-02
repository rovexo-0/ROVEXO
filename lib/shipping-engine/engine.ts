import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditShippingEngineAction, createShippingEngineAuditEntry } from "@/lib/shipping-engine/audit";
import {
  createDefaultShippingEngineDocument,
  createDefaultShippingEngineHistory,
} from "@/lib/shipping-engine/defaults";
import {
  SHIPPING_ENGINE_DRAFT_KEY,
  SHIPPING_ENGINE_HISTORY_KEY,
  SHIPPING_ENGINE_LIVE_KEY,
} from "@/lib/shipping-engine/keys";
import type { ShippingEngineDocument, ShippingEngineHistoryEntry } from "@/lib/shipping-engine/types";

function normalizeDocument(doc: ShippingEngineDocument): ShippingEngineDocument {
  return {
    ...createDefaultShippingEngineDocument(doc.label),
    ...doc,
    methods: doc.methods ?? [],
    zones: doc.zones ?? [],
    rules: doc.rules ?? [],
    carriers: doc.carriers ?? [],
    returnRules: doc.returnRules ?? [],
    trackingRules: doc.trackingRules ?? [],
    notifications: doc.notifications ?? [],
    analyticsMetrics: doc.analyticsMetrics ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveShippingEngineDocument(): Promise<ShippingEngineDocument> {
  const doc = await getPlatformSetting<ShippingEngineDocument>(
    SHIPPING_ENGINE_LIVE_KEY,
    createDefaultShippingEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getShippingEngineDraft(): Promise<ShippingEngineDocument> {
  const live = await readLiveShippingEngineDocument();
  const draft = await getPlatformSetting<ShippingEngineDocument>(SHIPPING_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getShippingEngineHistory(): Promise<ShippingEngineHistoryEntry[]> {
  return getPlatformSetting(SHIPPING_ENGINE_HISTORY_KEY, createDefaultShippingEngineHistory());
}

export async function getShippingEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getShippingEngineDraft(),
    readLiveShippingEngineDocument(),
    getShippingEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveShippingEngineDraft(
  document: ShippingEngineDocument,
  actorId: string,
): Promise<ShippingEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createShippingEngineAuditEntry({
        administrator: actorId,
        module: "shipping-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: SHIPPING_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditShippingEngineAction({
    actorId,
    module: "shipping-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishShippingEngine(actorId: string): Promise<ShippingEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getShippingEngineDraft(),
    readLiveShippingEngineDocument(),
    getShippingEngineHistory(),
  ]);

  const historyEntry: ShippingEngineHistoryEntry = {
    id: `se-${Date.now()}`,
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
      createShippingEngineAuditEntry({
        administrator: actorId,
        module: "shipping-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SHIPPING_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SHIPPING_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: SHIPPING_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditShippingEngineAction({
    actorId,
    module: "shipping-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackShippingEngine(historyId: string, actorId: string): Promise<ShippingEngineDocument> {
  const history = await getShippingEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Shipping Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: SHIPPING_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: SHIPPING_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditShippingEngineAction({
    actorId,
    module: "shipping-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetShippingEngineDraft(actorId: string): Promise<ShippingEngineDocument> {
  const live = await readLiveShippingEngineDocument();
  return saveShippingEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateShippingEngineDraft(actorId: string): Promise<ShippingEngineDocument> {
  const draft = await getShippingEngineDraft();
  return saveShippingEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportShippingEngineDocument(): Promise<ShippingEngineDocument> {
  return getShippingEngineDraft();
}

export async function importShippingEngineDocument(
  document: ShippingEngineDocument,
  actorId: string,
): Promise<ShippingEngineDocument> {
  return saveShippingEngineDraft(document, actorId);
}
