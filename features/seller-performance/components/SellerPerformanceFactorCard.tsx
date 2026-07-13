"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { FactorBreakdownItem } from "@/lib/seller-performance/types";

type SellerPerformanceFactorCardProps = {
  factor: FactorBreakdownItem;
};

export function SellerPerformanceFactorCard({ factor }: SellerPerformanceFactorCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <div className="rounded-ds-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{factor.label}</p>
          <p className="mt-1 text-sm text-text-primary">{factor.currentValue}</p>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-text-secondary",
            focusRing,
          )}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={`Explain ${factor.label}`}
          onClick={() => setOpen((current) => !current)}
        >
          i
        </button>
      </div>
      {open ? (
        <div id={detailsId} className="mt-3 space-y-2 border-t border-border pt-3 text-xs text-text-secondary">
          <p>{factor.description}</p>
          <p>
            Component score: <strong>{factor.componentScore}</strong> / 100
          </p>
          <p>
            Max contribution: <strong>{factor.maxContributionPercent}%</strong>
          </p>
          <p>
            Current contribution: <strong>{factor.currentContribution.toFixed(1)}</strong> points
          </p>
        </div>
      ) : null}
    </div>
  );
}
