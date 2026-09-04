"use client";

import { useState } from "react";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { IconButton } from "@/components/ui/IconButton";
import { CanonicalCard } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { ANALYTICS_DATE_RANGES, type AnalyticsDateRange } from "@/lib/analytics/types";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type AnalyticsHeaderProps = {
  backHref: string;
  activeRange: AnalyticsDateRange;
  onRangeChange: (range: AnalyticsDateRange) => void;
};

function FilterIcon({ className }: { className?: string }) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.filter} size={20} className={className} />;
}

export function AnalyticsHeader({ backHref, activeRange, onRangeChange }: AnalyticsHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeLabel =
    ANALYTICS_DATE_RANGES.find((range) => range.id === activeRange)?.label ?? "30 Days";

  return (
    <>
      <CanonicalPageHeader title="Analytics" backHref={backHref} />

      <div className="flex items-center justify-end px-ds-4 pb-ds-2">
        <IconButton
          label={`Filter date range, ${activeLabel}`}
          variant="ghost"
          size="md"
          onClick={() => setFilterOpen(true)}
        >
          <FilterIcon className="h-5 w-5" />
        </IconButton>
      </div>

      <ModalContainer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        variant="centered"
        zIndex={120}
        ariaLabel="Date range filter"
        scrollPanel={false}
      >
        <CanonicalCard variant="small" className="mt-ds-3 w-full max-w-none shadow-ds-floating">
          <h2 className="text-base font-semibold text-text-primary">Date range</h2>
          <div className="mt-ds-2 flex flex-wrap gap-ds-2">
            {ANALYTICS_DATE_RANGES.map((range) => (
              <CategoryChip
                key={range.id}
                label={range.label}
                active={range.id === activeRange}
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
