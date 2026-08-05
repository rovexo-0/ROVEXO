/**
 * Wallet hub live balance — wallets + wallet_transactions (Realtime Certification v1.0).
 * Reuses account snapshot API (one SSOT) — no parallel wallet fetch system.
 * P8: wallet-only RT channels + equal-bail setData (no financial behaviour change).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeAccountHubChannel,
  subscribeToWalletLiveStats,
} from "@/lib/account-center/realtime";
import { fetchAccountSnapshotShared } from "@/lib/account-center/fetch-account-snapshot-shared";
import { isDocumentVisible } from "@/lib/performance/visibility";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WalletData } from "@/lib/wallet/types";

async function fetchWalletFromSnapshot(): Promise<WalletData | null> {
  const payload = await fetchAccountSnapshotShared();
  return payload.wallet ?? null;
}

/** Compare hub-visible money fields — skip setState when RT refresh is identical. */
export function walletLiveFingerprint(data: WalletData): string {
  const tx = data.transactions
    .map((row) => `${row.id}:${row.status}:${row.amount}:${row.createdAt}`)
    .join("|");
  return [
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

export function useWalletLive(userId: string, initial: WalletData): WalletLiveState {
  const [data, setData] = useState(initial);
  const [rtTick, setRtTick] = useState(0);
  const timerRef = useRef<number | null>(null);
  const fingerprintRef = useRef(walletLiveFingerprint(initial));

  const refresh = useCallback(async () => {
    if (!isDocumentVisible()) return;
    try {
      const next = await fetchWalletFromSnapshot();
      if (!next) return;
      const nextFp = walletLiveFingerprint(next);
      if (nextFp === fingerprintRef.current) return;
      fingerprintRef.current = nextFp;
      setData(next);
    } catch {
      // ignore transient
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
  }, [userId, schedule]);

  return { data, rtTick };
}
