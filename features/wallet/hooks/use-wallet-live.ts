/**
 * Wallet hub live balance — wallets + wallet_transactions (Realtime Certification v1.0).
 * Reuses account snapshot API (one SSOT) — no parallel wallet fetch system.
 * Phase 1F: sellerContext-scoped snapshot — Business never refreshes from Individual.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeAccountHubChannel,
  subscribeToWalletLiveStats,
} from "@/lib/account-center/realtime";
import { fetchAccountSnapshotShared } from "@/lib/account-center/fetch-account-snapshot-shared";
import { isDocumentVisible } from "@/lib/performance/visibility";
import {
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WalletData } from "@/lib/wallet/types";

async function fetchWalletFromSnapshot(
  sellerContext: SellerContext,
): Promise<WalletData | null> {
  const payload = await fetchAccountSnapshotShared(sellerContext);
  if (payload.sellerContext !== sellerContext) {
    return null;
  }
  const wallet = payload.wallet ?? null;
  if (!wallet) return null;
  if (wallet.walletContext && wallet.walletContext !== sellerContext) {
    return null;
  }
  return wallet;
}

/** Compare hub-visible money fields — skip setState when RT refresh is identical. */
export function walletLiveFingerprint(data: WalletData): string {
  const tx = data.transactions
    .map((row) => `${row.id}:${row.status}:${row.amount}:${row.createdAt}`)
    .join("|");
  return [
    data.walletContext ?? "",
    data.availableBalance,
    data.pendingBalance,
    data.lockedBalance,
    data.paidOutBalance,
    data.pendingOrderCount,
    data.pendingAvailableAt,
    data.withdrawalSummary.processingTotal,
    data.withdrawalSummary.processingCount,
    data.withdrawalSummary.completedTotal,
    data.withdrawalSummary.completedCount,
    data.monthSummary.revenue.value,
    data.monthSummary.withdrawn.value,
    data.monthSummary.fees.value,
    tx,
  ].join(";");
}

export type WalletLiveState = {
  data: WalletData;
  /** Increments on every wallets/wallet_transactions postgres_changes callback. */
  rtTick: number;
};

export function useWalletLive(
  userId: string,
  initial: WalletData,
  sellerContext: SellerContext | string = "individual",
): WalletLiveState {
  const context = normalizeSellerContext(sellerContext);
  const [data, setData] = useState(initial);
  const [rtTick, setRtTick] = useState(0);
  const timerRef = useRef<number | null>(null);
  const fingerprintRef = useRef(walletLiveFingerprint(initial));
  const contextRef = useRef(context);

  const refresh = useCallback(async () => {
    if (!isDocumentVisible()) return;
    try {
      const next = await fetchWalletFromSnapshot(contextRef.current);
      if (!next) return;
      const nextFp = walletLiveFingerprint(next);
      if (nextFp === fingerprintRef.current) return;
      fingerprintRef.current = nextFp;
      setData(next);
    } catch {
      // ignore transient — keep last known in-context data (never cross-context)
    }
  }, []);

  const schedule = useCallback(() => {
    setRtTick((tick) => tick + 1);
    if (!isDocumentVisible()) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void refresh();
    }, 250);
  }, [refresh]);

  const [initialSource, setInitialSource] = useState(initial);
  if (initial !== initialSource) {
    setInitialSource(initial);
    setData(initial);
  }

  // Context switch (Individual ↔ Business): reset to server initial; never keep other hub data.
  useEffect(() => {
    if (contextRef.current === context) return;
    contextRef.current = context;
    setData(initial);
    fingerprintRef.current = walletLiveFingerprint(initial);
  }, [context, initial]);

  useEffect(() => {
    fingerprintRef.current = walletLiveFingerprint(data);
  }, [data]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const channel = subscribeToWalletLiveStats(userId, {
      onChange: schedule,
    });

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (channel) removeAccountHubChannel(channel);
    };
  }, [userId, schedule, context]);

  return { data, rtTick };
}
