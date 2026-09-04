"use client";

import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { ANALYTICS_DATE_RANGES, type AnalyticsDateRange } from "@/lib/analytics/types";
import { CanonicalCard } from "@/src/components/canonical";

type AnalyticsRangeActionProps = {
  activeRange: AnalyticsDateRange;
  onRangeChange: (range: AnalyticsDateRange) => void;
  /** Business PWA passes emoji. Seller keeps the existing glyph when omitted. */
  trigger?: ReactNode;
};

function FilterIcon({ className }: { className?: string }) {
  return <span className={className} aria-hidden>📅</span>;
}

/** Master shell rightAction — date range filter (Compact Premium). */
export function AnalyticsRangeAction({ activeRange, onRangeChange, trigger }: AnalyticsRangeActionProps) {
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
        {trigger ?? <FilterIcon className="h-5 w-5" />}
      </IconButton>

      <ModalContainer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        variant="centered"
        zIndex={120}
        ariaLabel="Date range filter"
        scrollPanel={false}
      >
        <CanonicalCard variant="medium" className="mx-auto mt-ds-3 w-full p-ds-4 shadow-ds-floating">
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
        </CanonicalCard>
      </ModalContainer>
    </>
  );
}
