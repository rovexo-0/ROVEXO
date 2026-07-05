"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import type { CommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1/types";

type CommandCenterLiveContextValue = {
  snapshot: CommandCenterV1Snapshot;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
};

const CommandCenterLiveContext = createContext<CommandCenterLiveContextValue | null>(null);

type CommandCenterLiveProviderProps = {
  initialSnapshot: CommandCenterV1Snapshot;
  children: ReactNode;
};

export function CommandCenterLiveProvider({ initialSnapshot, children }: CommandCenterLiveProviderProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/super-admin/command-center", { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { operationsCenter?: CommandCenterV1Snapshot };
      if (body.operationsCenter) {
        setSnapshot(body.operationsCenter);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useVisibilityPolling(refresh, 30_000, { immediate: false, refreshOnVisible: true });

  const value = useMemo(
    () => ({
      snapshot,
      refresh,
      isRefreshing,
    }),
    [snapshot, refresh, isRefreshing],
  );

  return <CommandCenterLiveContext.Provider value={value}>{children}</CommandCenterLiveContext.Provider>;
}

export function useCommandCenterLive(): CommandCenterLiveContextValue {
  const context = useContext(CommandCenterLiveContext);
  if (!context) {
    throw new Error("useCommandCenterLive must be used within CommandCenterLiveProvider");
  }
  return context;
}
