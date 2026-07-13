"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { SellerPerformanceHistoryChart } from "@/features/seller-performance/components/SellerPerformanceHistoryChart";
import type { ScoreHistoryRange, SellerPerformanceHistoryPoint } from "@/lib/seller-performance/types";

const RANGES: Array<{ id: ScoreHistoryRange; label: string }> = [
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "1y", label: "1 Year" },
  { id: "all", label: "All Time" },
];

type SellerPerformanceHistorySectionProps = {
  initialRange: ScoreHistoryRange;
  initialPoints: SellerPerformanceHistoryPoint[];
};

export function SellerPerformanceHistorySection({
  initialRange,
  initialPoints,
}: SellerPerformanceHistorySectionProps) {
  const [range, setRange] = useState<ScoreHistoryRange>(initialRange);
  const [points, setPoints] = useState(initialPoints);
  const [loading, setLoading] = useState(false);

  async function loadRange(nextRange: ScoreHistoryRange) {
    setRange(nextRange);
    setLoading(true);
    try {
      const response = await fetch(`/api/seller/performance?range=${nextRange}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { scoreHistory: SellerPerformanceHistoryPoint[] };
      setPoints(payload.scoreHistory);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Score history range">
        {RANGES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={range === entry.id}
            className={cn(
              "rounded-ds-full px-3 py-1.5 text-xs font-semibold",
              focusRing,
              range === entry.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-text-secondary",
            )}
            onClick={() => void loadRange(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <SellerPerformanceHistoryChart
        points={points}
        className={cn("mt-4 h-40 w-full", loading && "opacity-60")}
      />
    </div>
  );
}
