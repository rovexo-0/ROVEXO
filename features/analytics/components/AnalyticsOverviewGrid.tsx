"use client";

import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { formatOverviewValue } from "@/lib/analytics/utils";
import type { AnalyticsOverviewMetric } from "@/lib/analytics/types";

type AnalyticsOverviewGridProps = {
  title?: string;
  metrics: AnalyticsOverviewMetric[];
};

function OverviewCard({ label, value, format }: AnalyticsOverviewMetric) {
  return (
    <Card padding="sm" className="flex min-h-[88px] flex-col justify-center gap-ds-1 shadow-ds-soft">
      <span className="text-lg font-bold tabular-nums text-text-primary">
        <AnimatedCounter
          value={value}
          format={(next) => formatOverviewValue(next, format)}
        />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </Card>
  );
}

export function AnalyticsOverviewGrid({
  title = "Overview",
  metrics,
}: AnalyticsOverviewGridProps) {
  return (
    <section aria-labelledby="analytics-overview-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-overview-heading" className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-ds-3">
        {metrics.map((metric) => (
          <OverviewCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}
