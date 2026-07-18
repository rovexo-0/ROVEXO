"use client";

import { memo } from "react";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { AnalyticsSegment } from "@/lib/analytics/types";

type AnalyticsDoughnutChartProps = {
  title: string;
  segments: AnalyticsSegment[];
  headingId: string;
};

/** One Product — segment breakdown as Master Menu rows (no doughnut dashboard card). */
export const AnalyticsDoughnutChart = memo(function AnalyticsDoughnutChart({
  title,
  segments,
  headingId,
}: AnalyticsDoughnutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <CanonicalSection title={title}>
      <span id={headingId} className="sr-only">
        {title}
      </span>
      <CanonicalCard variant="list">
        {segments.length === 0 ? (
          <CanonicalMenuRow title="No data yet" showChevron={false} />
        ) : (
          segments.map((segment) => {
            const percent = Math.round((segment.value / total) * 100);
            return (
              <CanonicalMenuRow
                key={segment.id}
                title={segment.label}
                value={`${percent}%`}
                showChevron={false}
              />
            );
          })
        )}
      </CanonicalCard>
    </CanonicalSection>
  );
});
