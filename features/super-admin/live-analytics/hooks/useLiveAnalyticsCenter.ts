import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveAnalyticsSnapshot } from "@/lib/analytics/live-center/types";

const POLL_INTERVAL_MS = 30_000;

export function useLiveAnalyticsCenter() {
  const [snapshot, setSnapshot] = useState<LiveAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef<(manual?: boolean) => Promise<void>>(async () => undefined);

  useEffect(() => {
    let cancelled = false;
    let intervalId = 0;

    const run = async (manual = false) => {
      if (manual && !cancelled) setRefreshing(true);

      try {
        const url = manual
          ? "/api/analytics/live-center?refresh=1"
          : "/api/analytics/live-center";
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setError("Unable to load live analytics.");
          return;
        }

        const payload = (await response.json()) as LiveAnalyticsSnapshot;
        if (cancelled) return;

        setSnapshot(payload);
        setError(null);
      } catch {
        if (!cancelled) setError("Unable to load live analytics.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadRef.current = run;
    void run();
    intervalId = window.setInterval(() => void run(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const refresh = useCallback(() => void loadRef.current(true), []);

  return { snapshot, loading, refreshing, error, refresh };
}
