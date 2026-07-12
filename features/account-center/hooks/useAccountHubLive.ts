"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeAccountHubChannel,
  subscribeToAccountHubStats,
} from "@/lib/account-center/realtime";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import { fetchDeduped } from "@/lib/performance/fetch";
import { isDocumentVisible } from "@/lib/performance/visibility";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WalletData } from "@/lib/wallet/types";

type UseAccountHubLiveInput = {
  userId: string;
  snapshot: AccountHubSnapshot;
  wallet: WalletData | null;
};

type AccountHubLiveState = {
  snapshot: AccountHubSnapshot;
  wallet: WalletData | null;
};

async function fetchAccountHubLiveState(signal?: AbortSignal): Promise<AccountHubLiveState> {
  const response = await fetchDeduped("/api/account/snapshot", {
    cache: "no-store",
    signal,
    dedupeKey: "account-hub:snapshot",
  });

  if (!response.ok) {
    throw new Error("Unable to refresh account snapshot.");
  }

  const payload = (await response.json()) as AccountHubLiveState;
  return {
    snapshot: payload.snapshot,
    wallet: payload.wallet ?? null,
  };
}

export function useAccountHubLive({
  userId,
  snapshot: initialSnapshot,
  wallet: initialWallet,
}: UseAccountHubLiveInput): AccountHubLiveState {
  const [state, setState] = useState<AccountHubLiveState>({
    snapshot: initialSnapshot,
    wallet: initialWallet,
  });
  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const applyState = useCallback((next: AccountHubLiveState) => {
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!isDocumentVisible()) return;

    try {
      const next = await fetchAccountHubLiveState();
      applyState(next);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // ignore transient network errors
    }
  }, [applyState]);

  const scheduleRefresh = useCallback(() => {
    if (!isDocumentVisible()) return;
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void refresh();
    }, 250);
  }, [refresh]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;

    let channel: ReturnType<typeof subscribeToAccountHubStats> | null = null;
    let cancelled = false;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;

    const disconnect = () => {
      if (channel) {
        removeAccountHubChannel(channel);
        channel = null;
      }
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (!isDocumentVisible() || cancelled) return;

      disconnect();

      channel = subscribeToAccountHubStats(userId, {
        onChange: scheduleRefresh,
        onStatus: (status) => {
          if (status === "SUBSCRIBED") {
            reconnectAttempts = 0;
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (cancelled || reconnectTimer !== null || !isDocumentVisible()) return;
            const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
            reconnectAttempts += 1;
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null;
              connect();
            }, delay);
          }
        },
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        connect();
      } else {
        disconnect();
      }
    };

    if (isDocumentVisible()) connect();

    window.addEventListener("online", scheduleRefresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("online", scheduleRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      disconnect();
    };
  }, [userId, refresh, scheduleRefresh]);

  return state;
}
