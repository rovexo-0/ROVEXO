"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  MarketplaceAnalyticsSnapshot,
  MarketplaceManagerSummary,
  MarketplaceProviderView,
} from "@/lib/seller/marketplace/types";

type MarketplaceConnectorsState = {
  summary: MarketplaceManagerSummary | null;
  analytics: MarketplaceAnalyticsSnapshot | null;
  loading: boolean;
  error: string | null;
};

export function useMarketplaceConnectors() {
  const [state, setState] = useState<MarketplaceConnectorsState>({
    summary: null,
    analytics: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetch("/api/seller/marketplace/connectors", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load marketplace connectors.");
      const payload = (await response.json()) as {
        summary: MarketplaceManagerSummary;
        analytics: MarketplaceAnalyticsSnapshot;
      };
      setState({
        summary: payload.summary,
        analytics: payload.analytics,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load connectors.",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (
      platform: string,
      action:
        | "enable"
        | "disable"
        | "disconnect"
        | "delete_credentials"
        | "reset"
        | "health_check"
        | "retry"
        | "reconnect",
    ) => {
      const response = await fetch(`/api/seller/marketplace/connectors/${platform}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Action failed.");
      }
      await load();
    },
    [load],
  );

  const connectProvider = useCallback(
    async (
      platform: string,
      credentials: {
        storeUrl?: string;
        apiKey?: string;
        apiSecret?: string;
        accessToken?: string;
        fileName?: string;
      },
    ) => {
      const response = await fetch(`/api/seller/marketplace/connectors/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Connection failed.");
      }
      await load();
    },
    [load],
  );

  return {
    ...state,
    reload: load,
    runAction,
    connectProvider,
  };
}

export type { MarketplaceProviderView };
