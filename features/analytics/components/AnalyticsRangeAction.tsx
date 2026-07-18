"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { ANALYTICS_DATE_RANGES, type AnalyticsDateRange } from "@/lib/analytics/types";

type AnalyticsRangeActionProps = {
  activeRange: AnalyticsDateRange;
  onRangeChange: (range: AnalyticsDateRange) => void;
};

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6h.007v.008H3.75V6Zm0 6h.007v.008H3.75V12Zm0 6h.007v.008H3.75V18Z"
      />
    </svg>
  );
}

/** Master shell rightAction — date range filter (Compact Premium). */
export function AnalyticsRangeAction({ activeRange, onRangeChange }: AnalyticsRangeActionProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeLabel =
    ANALYTICS_DATE_RANGES.find((range) => range.id === activeRange)?.label ?? "30 Days";

  return (
    <>
      <IconButton
        label={`Filter date range, ${activeLabel}`}
        variant="ghost"
        size="md"
        onClick={() => setFilterOpen(true)}
      >
        <FilterIcon className="h-5 w-5" />
      </IconButton>

      <ModalContainer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        variant="centered"
        zIndex={120}
        ariaLabel="Date range filter"
        scrollPanel={false}
      >
        <Card padding="md" className="mx-auto mt-ds-3 max-w-2xl shadow-ds-floating">
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
      </ModalContainer>
    </>
  );
}
