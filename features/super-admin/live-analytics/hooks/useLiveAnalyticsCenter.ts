import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveAnalyticsSnapshot } from "@/lib/analytics/live-center/types";
import { useVisibilityPolling } from "@/lib/performance/hooks";

const POLL_INTERVAL_MS = 30_000;

export function useLiveAnalyticsCenter() {
  const [snapshot, setSnapshot] = useState<LiveAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef<(manual?: boolean) => Promise<void>>(async () => undefined);

  const run = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const url = manual
        ? "/api/analytics/live-center?refresh=1"
        : "/api/analytics/live-center";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load live analytics.");
        return;
      }

      const payload = (await response.json()) as LiveAnalyticsSnapshot;
      setSnapshot(payload);
      setError(null);
    } catch {
      setError("Unable to load live analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRef.current = run;
  }, [run]);

  useVisibilityPolling(() => void loadRef.current(false), POLL_INTERVAL_MS, {
    immediate: true,
    refreshOnVisible: true,
  });

  const refresh = useCallback(() => void loadRef.current(true), []);

  return { snapshot, loading, refreshing, error, refresh };
}
