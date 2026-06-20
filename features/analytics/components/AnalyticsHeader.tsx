"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ANALYTICS_DATE_RANGES, type AnalyticsDateRange } from "@/lib/analytics/types";

type AnalyticsHeaderProps = {
  backHref: string;
  activeRange: AnalyticsDateRange;
  onRangeChange: (range: AnalyticsDateRange) => void;
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6h.007v.008H3.75V6Zm0 6h.007v.008H3.75V12Zm0 6h.007v.008H3.75V18Z" />
    </svg>
  );
}

export function AnalyticsHeader({ backHref, activeRange, onRangeChange }: AnalyticsHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeLabel =
    ANALYTICS_DATE_RANGES.find((range) => range.id === activeRange)?.label ?? "30 Days";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 shadow-ds-soft backdrop-blur-xl backdrop-saturate-150">
        <div
          className={cn(
            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <IconButton href={backHref} label="Go back" variant="ghost" size="md" className="justify-self-start">
            <BackIcon className="h-5 w-5" />
          </IconButton>

          <h1 className="truncate text-center text-lg font-semibold text-text-primary">Analytics</h1>

          <IconButton
            label={`Filter date range, ${activeLabel}`}
            variant="ghost"
            size="md"
            className="justify-self-end"
            onClick={() => setFilterOpen(true)}
          >
            <FilterIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      {filterOpen && (
        <div className="fixed inset-0 z-[120] bg-overlay px-ds-4 pt-[calc(56px+env(safe-area-inset-top))]">
          <button
            type="button"
            aria-label="Close date range filter"
            className="absolute inset-0"
            onClick={() => setFilterOpen(false)}
          />
          <Card padding="md" className="relative mx-auto mt-ds-3 max-w-2xl shadow-ds-floating">
            <h2 className="text-base font-semibold text-text-primary">Date Range</h2>
            <div className="mt-ds-4 flex flex-wrap gap-ds-2">
              {ANALYTICS_DATE_RANGES.map((range) => (
                <CategoryChip
                  key={range.id}
                  label={range.label}
                  active={activeRange === range.id}
                  onClick={() => {
                    onRangeChange(range.id);
                    setFilterOpen(false);
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
