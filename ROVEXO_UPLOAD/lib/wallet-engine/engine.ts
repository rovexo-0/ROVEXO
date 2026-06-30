import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditWalletEngineAction, createWalletEngineAuditEntry } from "@/lib/wallet-engine/audit";
import {
  createDefaultWalletEngineDocument,
  createDefaultWalletEngineHistory,
} from "@/lib/wallet-engine/defaults";
import {
  WALLET_ENGINE_DRAFT_KEY,
  WALLET_ENGINE_HISTORY_KEY,
  WALLET_ENGINE_LIVE_KEY,
} from "@/lib/wallet-engine/keys";
import type { WalletEngineDocument, WalletEngineHistoryEntry } from "@/lib/wallet-engine/types";

function normalizeDocument(doc: WalletEngineDocument): WalletEngineDocument {
  return {
    ...createDefaultWalletEngineDocument(doc.label),
    ...doc,
    walletTypes: doc.walletTypes ?? [],
    balanceTypes: doc.balanceTypes ?? [],
    transactionTypes: doc.transactionTypes ?? [],
    payoutMethods: doc.payoutMethods ?? [],
    filters: doc.filters ?? [],
    notifications: doc.notifications ?? [],
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveWalletEngineDocument(): Promise<WalletEngineDocument> {
  const doc = await getPlatformSetting<WalletEngineDocument>(
    WALLET_ENGINE_LIVE_KEY,
    createDefaultWalletEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getWalletEngineDraft(): Promise<WalletEngineDocument> {
  const live = await readLiveWalletEngineDocument();
  const draft = await getPlatformSetting<WalletEngineDocument>(WALLET_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getWalletEngineHistory(): Promise<WalletEngineHistoryEntry[]> {
  return getPlatformSetting(WALLET_ENGINE_HISTORY_KEY, createDefaultWalletEngineHistory());
}

export async function getWalletEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getWalletEngineDraft(),
    readLiveWalletEngineDocument(),
    getWalletEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveWalletEngineDraft(
  document: WalletEngineDocument,
  actorId: string,
): Promise<WalletEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createWalletEngineAuditEntry({
        administrator: actorId,
        module: "wallet-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: WALLET_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditWalletEngineAction({
    actorId,
    module: "wallet-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishWalletEngine(actorId: string): Promise<WalletEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getWalletEngineDraft(),
    readLiveWalletEngineDocument(),
    getWalletEngineHistory(),
  ]);

  const historyEntry: WalletEngineHistoryEntry = {
    id: `we-${Date.now()}`,
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
      createWalletEngineAuditEntry({
        administrator: actorId,
        module: "wallet-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: WALLET_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: WALLET_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: WALLET_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditWalletEngineAction({
    actorId,
    module: "wallet-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackWalletEngine(historyId: string, actorId: string): Promise<WalletEngineDocument> {
  const history = await getWalletEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Wallet Engine rollback entry not found.");

  const restored = normalizeDocument({ ...entry.bundle, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: WALLET_ENGINE_LIVE_KEY, value: restored as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: WALLET_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditWalletEngineAction({
    actorId,
    module: "wallet-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetWalletEngineDraft(actorId: string): Promise<WalletEngineDocument> {
  const live = await readLiveWalletEngineDocument();
  return saveWalletEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateWalletEngineDraft(actorId: string): Promise<WalletEngineDocument> {
  const draft = await getWalletEngineDraft();
  return saveWalletEngineDraft({ ...draft, label: `${draft.label} Copy`, version: draft.version + 1 }, actorId);
}

export async function exportWalletEngineDocument(): Promise<WalletEngineDocument> {
  return getWalletEngineDraft();
}

export async function importWalletEngineDocument(
  document: WalletEngineDocument,
  actorId: string,
): Promise<WalletEngineDocument> {
  return saveWalletEngineDraft(document, actorId);
}
