"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import type { LiveCountriesSnapshot, LiveCountry } from "@/lib/analytics/live-countries/types";

const POLL_INTERVAL_MS = 10_000;

type DisplayCountry = LiveCountry & {
  state: "entering" | "visible" | "leaving";
};

export function LiveCountriesPanel() {
  const [snapshot, setSnapshot] = useState<LiveCountriesSnapshot | null>(null);
  const [displayCountries, setDisplayCountries] = useState<DisplayCountry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const leavingTimers = useRef<Map<string, number>>(new Map());

  const maxActiveUsers = useMemo(() => {
    if (!displayCountries.length) return 1;
    return Math.max(...displayCountries.map((country) => country.activeUsers), 1);
  }, [displayCountries]);

  const syncCountries = useCallback((nextCountries: LiveCountry[]) => {
    setDisplayCountries((current) => {
      const nextCodes = new Set(nextCountries.map((country) => country.code));
      const currentMap = new Map(current.map((country) => [country.code, country]));

      const merged: DisplayCountry[] = nextCountries.map((country) => {
        const existing = currentMap.get(country.code);
        const timer = leavingTimers.current.get(country.code);
        if (timer) {
          window.clearTimeout(timer);
          leavingTimers.current.delete(country.code);
        }

        return {
          ...country,
          state: existing ? "visible" : "entering",
        };
      });

      for (const country of current) {
        if (nextCodes.has(country.code) || country.state === "leaving") continue;

        merged.push({ ...country, state: "leaving" });
        const timeout = window.setTimeout(() => {
          leavingTimers.current.delete(country.code);
          setDisplayCountries((rows) => rows.filter((row) => row.code !== country.code));
        }, 320);
        leavingTimers.current.set(country.code, timeout);
      }

      return merged.sort((left, right) => right.activeUsers - left.activeUsers);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/live-countries", { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load live countries.");
        return;
      }

      const payload = (await response.json()) as LiveCountriesSnapshot;
      setSnapshot(payload);
      setError(null);
      syncCountries(payload.countries);
    } catch {
      setError("Unable to load live countries.");
    }
  }, [syncCountries]);

  useVisibilityPolling(() => void load(), POLL_INTERVAL_MS, {
    immediate: true,
    refreshOnVisible: true,
  });

  useEffect(() => {
    const timers = leavingTimers.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const totalActive = displayCountries
    .filter((country) => country.state !== "leaving")
    .reduce((sum, country) => sum + country.activeUsers, 0);

  return (
    <section aria-labelledby="live-countries-heading" className="flex flex-col gap-ds-4">
      <div className="flex flex-wrap items-end justify-between gap-ds-3">
        <div>
          <h2 id="live-countries-heading" className="text-lg font-semibold text-text-primary">
            Live Countries
          </h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            {displayCountries.length.toLocaleString()} active{" "}
            {displayCountries.length === 1 ? "country" : "countries"} ·{" "}
            {totalActive.toLocaleString()} active users
          </p>
        </div>
        {snapshot ? (
          <p className="text-xs text-text-muted">
            Source: {snapshot.source === "ga4" ? "Google Analytics 4" : "Platform heartbeat"} · Updated{" "}
            {new Date(snapshot.updatedAt).toLocaleTimeString("en-GB")}
          </p>
        ) : null}
      </div>

      <div
        className="live-countries-scroll rx-surface-card overflow-y-auto scroll-smooth p-ds-2"
        role="list"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {error ? <p className="p-ds-4 text-sm text-danger">{error}</p> : null}
        {!error && !displayCountries.length ? (
          <p className="p-ds-6 text-center text-sm text-text-secondary">
            No active visitors right now.
          </p>
        ) : null}

        <ul className="flex flex-col gap-ds-2">
          {displayCountries.map((country) => {
            const activityWidth = Math.max(8, (country.activeUsers / maxActiveUsers) * 100);

            return (
              <li
                key={country.code}
                role="listitem"
                className={cn(
                  "live-country-row rounded-ds-lg border border-border/70 bg-surface px-ds-4 py-ds-3",
                  country.state === "entering" && "live-country-row-enter",
                  country.state === "leaving" && "live-country-row-leave",
                )}
              >
                <div className="flex items-center gap-ds-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {country.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-ds-3">
                      <p className="truncate text-sm font-semibold text-text-primary">{country.name}</p>
                      <div className="flex shrink-0 items-center gap-ds-2">
                        <span className="text-sm font-bold tabular-nums text-text-primary">
                          {country.activeUsers.toLocaleString()}
                        </span>
                        <span className="live-country-pulse inline-flex items-center gap-ds-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                          <span className="live-country-pulse-dot" aria-hidden />
                          Live
                        </span>
                      </div>
                    </div>
                    <div
                      className="mt-ds-2 h-1.5 overflow-hidden rounded-ds-full bg-surface-muted"
                      aria-hidden
                    >
                      <div
                        className="live-country-bar h-full rounded-ds-full bg-primary/80"
                        style={{ width: `${activityWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
