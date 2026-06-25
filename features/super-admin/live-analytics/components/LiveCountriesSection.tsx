"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { LiveCountryRow } from "@/lib/analytics/live-center/types";
import { AnimatedNumber } from "@/features/super-admin/live-analytics/components/AnimatedNumber";
import { MiniSparkline } from "@/features/super-admin/live-analytics/components/MiniSparkline";
import { useVirtualList } from "@/features/super-admin/live-analytics/hooks/useVirtualList";

const ROW_HEIGHT = 76;

type DisplayCountry = LiveCountryRow & {
  state: "entering" | "visible" | "leaving";
};

type LiveCountriesSectionProps = {
  countries: LiveCountryRow[];
  updatedAt: string;
};

export function LiveCountriesSection({ countries, updatedAt }: LiveCountriesSectionProps) {
  const [displayCountries, setDisplayCountries] = useState<DisplayCountry[]>([]);
  const leavingTimers = useRef<Map<string, number>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const syncCountries = (nextCountries: LiveCountryRow[]) => {
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
  };

  useEffect(() => {
    syncCountries(countries);
    const timers = leavingTimers.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, [countries]);

  const activeCountries = displayCountries.filter((country) => country.state !== "leaving");
  const totalActive = activeCountries.reduce((sum, country) => sum + country.activeUsers, 0);
  const maxActiveUsers = useMemo(
    () => Math.max(...activeCountries.map((country) => country.activeUsers), 1),
    [activeCountries],
  );

  const virtual = useVirtualList(scrollRef, activeCountries.length, ROW_HEIGHT);
  const visibleCountries = activeCountries.slice(virtual.startIndex, virtual.endIndex);

  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4" aria-labelledby="live-countries-heading">
      <header className="mb-ds-4 flex flex-wrap items-end justify-between gap-ds-3">
        <div>
          <h2 id="live-countries-heading" className="text-base font-semibold text-text-primary">
            🌍 Active Countries
          </h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            <AnimatedNumber value={activeCountries.length} /> active{" "}
            {activeCountries.length === 1 ? "country" : "countries"} ·{" "}
            <AnimatedNumber value={totalActive} /> live visitors
          </p>
        </div>
        <p className="text-xs text-text-muted">
          Last update {new Date(updatedAt).toLocaleTimeString("en-GB")}
        </p>
      </header>

      <div
        ref={scrollRef}
        className="live-countries-scroll live-analytics-scroll rounded-ds-xl border border-border/50 bg-white/60 p-ds-2"
        role="list"
        aria-live="polite"
      >
        {activeCountries.length === 0 ? (
          <p className="p-ds-6 text-center text-sm text-text-secondary">No active visitors right now.</p>
        ) : (
          <div style={{ height: virtual.totalHeight, position: "relative" }}>
            <ul
              className="absolute inset-x-0 flex flex-col gap-ds-2"
              style={{ transform: `translateY(${virtual.offsetTop}px)` }}
            >
              {visibleCountries.map((country) => (
                <li
                  key={country.code}
                  role="listitem"
                  style={{ minHeight: ROW_HEIGHT - 8 }}
                  className={cn(
                    "live-country-row rounded-ds-lg border border-border/70 bg-white/90 px-ds-4 py-ds-3",
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
                          <AnimatedNumber
                            value={country.activeUsers}
                            className="text-sm font-bold tabular-nums text-text-primary"
                          />
                          <span className="text-xs text-text-muted">{country.percentage}%</span>
                          <span className="live-country-pulse inline-flex items-center gap-ds-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                            <span className="live-country-pulse-dot" aria-hidden />
                            Live
                          </span>
                        </div>
                      </div>
                      <div className="mt-ds-2">
                        <MiniSparkline value={country.activeUsers} max={maxActiveUsers} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
