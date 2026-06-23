"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { AnalyticsSegment } from "@/lib/analytics/types";

type AnalyticsDoughnutChartProps = {
  title: string;
  segments: AnalyticsSegment[];
  headingId: string;
};

const SEGMENT_COLORS = [
  "text-primary",
  "text-success",
  "text-warning",
  "text-danger",
] as const;

export function AnalyticsDoughnutChart({
  title,
  segments,
  headingId,
}: AnalyticsDoughnutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const segmentArcs = segments.reduce<
    Array<{ segment: AnalyticsSegment; index: number; length: number; offset: number }>
  >((acc, segment, index) => {
    const length = (segment.value / total) * circumference;
    const offset = acc.reduce((sum, item) => sum + item.length, 0);
    acc.push({ segment, index, length, offset });
    return acc;
  }, []);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-ds-3">
      <h2 id={headingId} className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <Card padding="md" className="">
        <div className="flex flex-col items-center gap-ds-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={title}>
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                className="text-surface-muted"
              />
              {segmentArcs.map(({ segment, index, length, offset }) => (
                  <circle
                    key={segment.id}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    className={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                  />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-text-primary">{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-ds-2">
            {segments.map((segment, index) => {
              const percent = Math.round((segment.value / total) * 100);

              return (
                <div key={segment.id} className="flex items-center justify-between gap-ds-3">
                  <div className="flex min-w-0 items-center gap-ds-2">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-ds-full bg-current",
                        SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                      )}
                      aria-hidden
                    />
                    <span className="truncate text-sm text-text-primary">{segment.label}</span>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-text-secondary">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
