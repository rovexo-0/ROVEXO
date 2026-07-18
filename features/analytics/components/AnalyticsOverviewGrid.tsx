"use client";

import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { formatOverviewValue } from "@/lib/analytics/utils";
import type { AnalyticsOverviewMetric } from "@/lib/analytics/types";
import { CanonicalCard, CanonicalSection } from "@/src/components/canonical";

type AnalyticsOverviewGridProps = {
  title?: string;
  metrics: AnalyticsOverviewMetric[];
};

function OverviewMetric({ label, value, format }: AnalyticsOverviewMetric) {
  return (
    <CanonicalCard variant="small" className="flex min-h-[72px] flex-col justify-center gap-ds-1 p-ds-3">
      <span className="text-lg font-bold tabular-nums text-text-primary">
        <AnimatedCounter value={value} format={(next) => formatOverviewValue(next, format)} />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </CanonicalCard>
  );
}

export function AnalyticsOverviewGrid({
  title = "Overview",
  metrics,
}: AnalyticsOverviewGridProps) {
  return (
    <CanonicalSection title={title} titleId="analytics-overview-heading">
      <div className="grid w-full grid-cols-2 gap-ds-2">
        {metrics.map((metric) => (
          <OverviewMetric key={metric.label} {...metric} />
        ))}
      </div>
    </CanonicalSection>
  );
}
