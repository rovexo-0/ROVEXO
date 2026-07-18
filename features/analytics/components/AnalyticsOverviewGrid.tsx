"use client";

import { formatOverviewValue } from "@/lib/analytics/utils";
import type { AnalyticsOverviewMetric } from "@/lib/analytics/types";
import { CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

type AnalyticsOverviewGridProps = {
  title?: string;
  metrics: AnalyticsOverviewMetric[];
};

export function AnalyticsOverviewGrid({
  title = "Overview",
  metrics,
}: AnalyticsOverviewGridProps) {
  return (
    <CanonicalSection title={title} titleId="analytics-overview-heading">
      <div className="flex w-full flex-col">
        {metrics.map((metric) => (
          <CanonicalMenuRow
            key={metric.label}
            title={metric.label}
            value={formatOverviewValue(metric.value, metric.format)}
            showChevron={false}
          />
        ))}
      </div>
    </CanonicalSection>
  );
}
