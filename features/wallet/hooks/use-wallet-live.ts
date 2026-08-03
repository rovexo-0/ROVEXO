/**
 * Wallet hub live balance — wallets + wallet_transactions (Realtime Certification v1.0).
 * Reuses account snapshot API (one SSOT) — no parallel wallet fetch system.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeAccountHubChannel,
  subscribeToAccountHubStats,
} from "@/lib/account-center/realtime";
import { fetchDeduped } from "@/lib/performance/fetch";
import { isDocumentVisible } from "@/lib/performance/visibility";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WalletData } from "@/lib/wallet/types";

async function fetchWalletFromSnapshot(signal?: AbortSignal): Promise<WalletData | null> {
  const response = await fetchDeduped("/api/account/snapshot", {
    cache: "no-store",
    signal,
    dedupeKey: "wallet-hub:snapshot",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { wallet?: WalletData | null };
  return payload.wallet ?? null;
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

  const refresh = useCallback(async () => {
    if (!isDocumentVisible()) return;
    try {
      const next = await fetchWalletFromSnapshot();
      if (next) setData(next);
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
    if (!userId || !isSupabaseConfigured()) return;

    const channel = subscribeToAccountHubStats(userId, {
      onChange: schedule,
    });

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (channel) removeAccountHubChannel(channel);
    };
  }, [userId, schedule]);

  return { data, rtTick };
}
