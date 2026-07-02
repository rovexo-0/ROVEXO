import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditPaymentsEngineAction, createPaymentsEngineAuditEntry } from "@/lib/payments-engine/audit";
import {
  createDefaultPaymentsEngineDocument,
  createDefaultPaymentsEngineHistory,
} from "@/lib/payments-engine/defaults";
import {
  PAYMENTS_ENGINE_DRAFT_KEY,
  PAYMENTS_ENGINE_HISTORY_KEY,
  PAYMENTS_ENGINE_LIVE_KEY,
} from "@/lib/payments-engine/keys";
import type { PaymentsEngineDocument, PaymentsEngineHistoryEntry } from "@/lib/payments-engine/types";

function normalizeDocument(doc: PaymentsEngineDocument): PaymentsEngineDocument {
  return {
    ...createDefaultPaymentsEngineDocument(doc.label),
    ...doc,
    paymentMethods: doc.paymentMethods ?? [],
    providers: doc.providers ?? [],
    payoutMethods: doc.payoutMethods ?? [],
    filters: doc.filters ?? [],
    notifications: doc.notifications ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLivePaymentsEngineDocument(): Promise<PaymentsEngineDocument> {
  const doc = await getPlatformSetting<PaymentsEngineDocument>(
    PAYMENTS_ENGINE_LIVE_KEY,
    createDefaultPaymentsEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getPaymentsEngineDraft(): Promise<PaymentsEngineDocument> {
  const live = await readLivePaymentsEngineDocument();
  const draft = await getPlatformSetting<PaymentsEngineDocument>(PAYMENTS_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getPaymentsEngineHistory(): Promise<PaymentsEngineHistoryEntry[]> {
  return getPlatformSetting(PAYMENTS_ENGINE_HISTORY_KEY, createDefaultPaymentsEngineHistory());
}

export async function getPaymentsEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getPaymentsEngineDraft(),
    readLivePaymentsEngineDocument(),
    getPaymentsEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function savePaymentsEngineDraft(
  document: PaymentsEngineDocument,
  actorId: string,
): Promise<PaymentsEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createPaymentsEngineAuditEntry({
        administrator: actorId,
        module: "payments-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: PAYMENTS_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditPaymentsEngineAction({
    actorId,
    module: "payments-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishPaymentsEngine(actorId: string): Promise<PaymentsEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getPaymentsEngineDraft(),
    readLivePaymentsEngineDocument(),
    getPaymentsEngineHistory(),
  ]);

  const historyEntry: PaymentsEngineHistoryEntry = {
    id: `pe-${Date.now()}`,
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
      createPaymentsEngineAuditEntry({
        administrator: actorId,
        module: "payments-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PAYMENTS_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PAYMENTS_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: PAYMENTS_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditPaymentsEngineAction({
    actorId,
    module: "payments-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackPaymentsEngine(historyId: string, actorId: string): Promise<PaymentsEngineDocument> {
  const history = await getPaymentsEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Payments Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: PAYMENTS_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: PAYMENTS_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditPaymentsEngineAction({
    actorId,
    module: "payments-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetPaymentsEngineDraft(actorId: string): Promise<PaymentsEngineDocument> {
  const live = await readLivePaymentsEngineDocument();
  return savePaymentsEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicatePaymentsEngineDraft(actorId: string): Promise<PaymentsEngineDocument> {
  const draft = await getPaymentsEngineDraft();
  return savePaymentsEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportPaymentsEngineDocument(): Promise<PaymentsEngineDocument> {
  return getPaymentsEngineDraft();
}

export async function importPaymentsEngineDocument(
  document: PaymentsEngineDocument,
  actorId: string,
): Promise<PaymentsEngineDocument> {
  return savePaymentsEngineDraft(document, actorId);
}
