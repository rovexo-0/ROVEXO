"use client";

import type { LiveCityRow } from "@/lib/analytics/live-center/types";
import { AnimatedNumber } from "@/features/super-admin/live-analytics/components/AnimatedNumber";

type LiveCitiesSectionProps = {
  cities: LiveCityRow[];
};

export function LiveCitiesSection({ cities }: LiveCitiesSectionProps) {
  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-3">
        <h3 className="text-sm font-semibold text-text-primary">📍 Live Top Cities</h3>
        <p className="mt-ds-1 text-xs text-text-secondary">Cities with active visitors right now</p>
      </header>

      {cities.length === 0 ? (
        <p className="py-ds-4 text-center text-sm text-text-secondary">No active cities</p>
      ) : (
        <ul className="live-analytics-scroll max-h-72 space-y-ds-2 overflow-y-auto">
          {cities.map((city) => (
            <li
              key={city.id}
              className="live-analytics-fade-in flex items-center justify-between gap-ds-3 rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {city.flag} {city.name}
                </p>
                <p className="truncate text-xs text-text-muted">{city.countryName}</p>
              </div>
              <div className="shrink-0 text-right">
                <AnimatedNumber value={city.activeUsers} className="text-sm font-bold tabular-nums" />
                <p className="text-xs text-text-muted">{city.percentage}%</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
