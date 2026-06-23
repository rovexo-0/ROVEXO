"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatAnalyticsCurrency } from "@/lib/analytics/utils";
import type { AnalyticsGeographicCountry } from "@/lib/analytics/types";

type AnalyticsGeographicSectionProps = {
  countries: AnalyticsGeographicCountry[];
};

export function AnalyticsGeographicSection({ countries }: AnalyticsGeographicSectionProps) {
  const [selectedId, setSelectedId] = useState(countries[0]?.id ?? "");
  const selected = useMemo(
    () => countries.find((country) => country.id === selectedId) ?? countries[0],
    [countries, selectedId],
  );

  return (
    <section aria-labelledby="analytics-geographic-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-geographic-heading" className="text-base font-semibold text-text-primary">
        Geographic Sales
      </h2>

      <Card padding="md" className="">
        <div className="overflow-hidden rounded-ds-md bg-surface-muted">
          <svg viewBox="0 0 360 180" className="h-auto w-full" role="img" aria-label="World sales map">
            <rect width="360" height="180" className="fill-surface-muted" />
            <path
              d="M20 92c28-18 56-24 84-18 18 4 34 2 48-6 16-8 34-10 52-6 28 6 54 18 78 34 10 8 18 18 24 30 4 8 4 16 0 24-8 14-22 22-38 24-24 4-48 2-72-4-28-8-54-22-76-40-10-8-16-18-18-28-2-12 2-24 10-34 8-10 18-16 28-18 6-2 12-2 18 0 8 2 14 6 20 12 4 4 8 8 12 12Z"
              className="fill-primary/10 stroke-border"
              strokeWidth="1"
            />
            {countries.map((country) => {
              const active = country.id === selected?.id;

              return (
                <g
                  key={country.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${country.name}, ${formatAnalyticsCurrency(country.revenue)} revenue`}
                  aria-pressed={active}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(country.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(country.id);
                    }
                  }}
                >
                  <circle
                    cx={country.mapX}
                    cy={country.mapY}
                    r={active ? 8 : 6}
                    className={cn(
                      active ? "fill-primary stroke-primary-foreground" : "fill-success/80 stroke-surface",
                    )}
                    strokeWidth="2"
                  />
                  <text
                    x={country.mapX}
                    y={country.mapY - 12}
                    textAnchor="middle"
                    className="fill-text-secondary text-[10px] font-semibold"
                  >
                    {country.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selected && (
          <div className="mt-ds-4 flex flex-col gap-ds-2">
            <p className="text-sm font-semibold text-text-primary">{selected.name}</p>
            <div className="flex flex-wrap gap-ds-3 text-sm text-text-secondary">
              <span>{formatAnalyticsCurrency(selected.revenue)} revenue</span>
              <span>{selected.orders.toLocaleString()} orders</span>
            </div>
          </div>
        )}

        <div className="mt-ds-4 flex flex-col gap-ds-2">
          {countries.map((country) => (
            <button
              key={country.id}
              type="button"
              onClick={() => setSelectedId(country.id)}
              className={cn(
                "flex min-h-ds-7 items-center justify-between gap-ds-3 rounded-ds-md px-ds-2 py-ds-2 text-left",
                country.id === selected?.id && "bg-surface-muted",
                focusRing,
              )}
            >
              <span className="truncate text-sm font-medium text-text-primary">{country.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                {formatAnalyticsCurrency(country.revenue)}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
