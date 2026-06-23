"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { transitionSlow } from "@/components/ui/tokens";
import type { DashboardPerformance } from "@/features/dashboard/types";

type DashboardPerformanceSectionProps = {
  performance: DashboardPerformance;
  title?: string;
  headingId?: string;
};

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";

  const max = Math.max(...values, 1);
  const stepX = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function formatTotal(value: number, format?: "currency" | "number"): string {
  if (format === "currency") return `€${value.toLocaleString()}`;
  return value.toLocaleString();
}

export function DashboardPerformanceSection({
  performance,
  title = "Performance",
  headingId = "dashboard-performance-heading",
}: DashboardPerformanceSectionProps) {
  const [metricId, setMetricId] = useState(performance.metrics[0]?.id ?? "revenue");
  const width = 280;
  const height = 120;

  const activeMetric = performance.metrics.find((metric) => metric.id === metricId) ?? performance.metrics[0];
  const values = useMemo(
    () => performance.points.map((point) => point.values[metricId] ?? 0),
    [metricId, performance.points],
  );

  const path = buildPath(values, width, height);
  const activeTotal = performance.totals[metricId] ?? 0;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-3">
        <h2 id={headingId} className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        <span className="text-xs font-medium text-text-secondary">{performance.periodLabel}</span>
      </div>

      <Card padding="md" className="flex flex-col gap-ds-4">
        <div className="flex flex-wrap gap-ds-2">
          {performance.metrics.map((metric) => (
            <CategoryChip
              key={metric.id}
              label={metric.label}
              active={metricId === metric.id}
              onClick={() => setMetricId(metric.id)}
            />
          ))}
        </div>

        <p className="text-2xl font-bold tabular-nums text-text-primary">
          {formatTotal(activeTotal, activeMetric?.format)}
        </p>

        <div className="overflow-hidden rounded-ds-md bg-surface-muted px-ds-2 py-ds-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className={cn("h-auto w-full", transitionSlow)}
            role="img"
            aria-label={`${activeMetric?.label ?? metricId} trend for ${performance.periodLabel}`}
          >
            <path d={`${path} L${width},${height} L0,${height} Z`} className="fill-primary/10" />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />
          </svg>
        </div>
      </Card>
    </section>
  );
}
