import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditOrdersEngineAction, createOrdersEngineAuditEntry } from "@/lib/orders-engine/audit";
import {
  createDefaultOrdersEngineDocument,
  createDefaultOrdersEngineHistory,
} from "@/lib/orders-engine/defaults";
import {
  ORDERS_ENGINE_DRAFT_KEY,
  ORDERS_ENGINE_HISTORY_KEY,
  ORDERS_ENGINE_LIVE_KEY,
} from "@/lib/orders-engine/keys";
import type { OrdersEngineDocument, OrdersEngineHistoryEntry } from "@/lib/orders-engine/types";

function normalizeDocument(doc: OrdersEngineDocument): OrdersEngineDocument {
  return {
    ...createDefaultOrdersEngineDocument(doc.label),
    ...doc,
    orderTypes: doc.orderTypes ?? [],
    filters: doc.filters ?? [],
    notifications: doc.notifications ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveOrdersEngineDocument(): Promise<OrdersEngineDocument> {
  const doc = await getPlatformSetting<OrdersEngineDocument>(
    ORDERS_ENGINE_LIVE_KEY,
    createDefaultOrdersEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getOrdersEngineDraft(): Promise<OrdersEngineDocument> {
  const live = await readLiveOrdersEngineDocument();
  const draft = await getPlatformSetting<OrdersEngineDocument>(ORDERS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getOrdersEngineHistory(): Promise<OrdersEngineHistoryEntry[]> {
  return getPlatformSetting(ORDERS_ENGINE_HISTORY_KEY, createDefaultOrdersEngineHistory());
}

export async function getOrdersEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getOrdersEngineDraft(),
    readLiveOrdersEngineDocument(),
    getOrdersEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveOrdersEngineDraft(
  document: OrdersEngineDocument,
  actorId: string,
): Promise<OrdersEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createOrdersEngineAuditEntry({
        administrator: actorId,
        module: "orders-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: ORDERS_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditOrdersEngineAction({
    actorId,
    module: "orders-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishOrdersEngine(actorId: string): Promise<OrdersEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getOrdersEngineDraft(),
    readLiveOrdersEngineDocument(),
    getOrdersEngineHistory(),
  ]);

  const historyEntry: OrdersEngineHistoryEntry = {
    id: `oe-${Date.now()}`,
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
      createOrdersEngineAuditEntry({
        administrator: actorId,
        module: "orders-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ORDERS_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ORDERS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: ORDERS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditOrdersEngineAction({
    actorId,
    module: "orders-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackOrdersEngine(historyId: string, actorId: string): Promise<OrdersEngineDocument> {
  const history = await getOrdersEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Orders Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: ORDERS_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: ORDERS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditOrdersEngineAction({
    actorId,
    module: "orders-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetOrdersEngineDraft(actorId: string): Promise<OrdersEngineDocument> {
  const live = await readLiveOrdersEngineDocument();
  return saveOrdersEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateOrdersEngineDraft(actorId: string): Promise<OrdersEngineDocument> {
  const draft = await getOrdersEngineDraft();
  return saveOrdersEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportOrdersEngineDocument(): Promise<OrdersEngineDocument> {
  return getOrdersEngineDraft();
}

export async function importOrdersEngineDocument(
  document: OrdersEngineDocument,
  actorId: string,
): Promise<OrdersEngineDocument> {
  return saveOrdersEngineDraft(document, actorId);
}
