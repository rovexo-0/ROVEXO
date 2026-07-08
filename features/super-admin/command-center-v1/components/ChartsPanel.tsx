"use client";

import type { CommandCenterChartSeries } from "@/lib/super-admin/command-center-v1/types";
import {
  isChartSeriesEmpty,
  resolveChartHeaderDisplay,
} from "@/features/super-admin/command-center-v1/lib/resolve-metric-display";
import { LiveStatusBadge } from "@/features/super-admin/command-center-v1/components/LiveStatusBadge";

const TONE_STROKE: Record<CommandCenterChartSeries["tone"], string> = {
  healthy: "#16a34a",
  info: "var(--ds-color-primary)",
  warning: "#ea580c",
  critical: "#dc2626",
  analytics: "#7c3aed",
  marketplace: "#0891b2",
};

type SparklineChartProps = {
  series: CommandCenterChartSeries;
};

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="cc1-chart__empty" role="status" aria-live="polite">
      <div className="cc1-chart__empty-icon" aria-hidden="true">
        <span className="cc1-chart__pulse" />
      </div>
      <p className="cc1-chart__empty-title">Collecting production data...</p>
      <p className="cc1-chart__empty-subtitle">
        Charts will automatically populate after live events are recorded.
      </p>
      <span className="cc1-sr-only">{label} chart has no production data points yet.</span>
    </div>
  );
}

export function SparklineChart({ series }: SparklineChartProps) {
  const empty = isChartSeriesEmpty(series.points);
  const header = resolveChartHeaderDisplay(series.id, series.points);

  if (empty) {
    return (
      <article
        className="cc1-chart cc1-chart--empty"
        aria-label={`${series.label} trend chart`}
        title={header.tooltip}
      >
        <header className="cc1-chart__header">
          <h3 className="cc1-chart__title">{series.label}</h3>
          {header.badge ? <LiveStatusBadge label={header.badge.label} variant={header.badge.variant} /> : null}
        </header>
        <ChartEmptyState label={series.label} />
      </article>
    );
  }

  const max = Math.max(...series.points, 1);
  const min = Math.min(...series.points, 0);
  const range = Math.max(max - min, 1);
  const width = 280;
  const height = 72;
  const padding = 4;

  const points = series.points
    .map((value, index) => {
      const x = padding + (index / Math.max(series.points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="cc1-chart" aria-label={`${series.label} trend chart`} title={header.tooltip}>
      <header className="cc1-chart__header">
        <h3 className="cc1-chart__title">{series.label}</h3>
        <span className="cc1-chart__value">{header.displayText}</span>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} className="cc1-chart__svg" role="img" aria-label={`${series.label} sparkline`}>
        <polyline
          fill="none"
          stroke={TONE_STROKE[series.tone]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </article>
  );
}

type ChartsPanelProps = {
  charts: CommandCenterChartSeries[];
};

export function ChartsPanel({ charts }: ChartsPanelProps) {
  return (
    <section className="cc1-panel" aria-labelledby="cc1-charts-heading">
      <header className="cc1-panel__header">
        <h2 id="cc1-charts-heading" className="cc1-panel__title">
          Real-time Charts
        </h2>
        <p className="cc1-panel__subtitle">Revenue, orders, visitors, infrastructure</p>
      </header>
      <div className="cc1-charts-grid">
        {charts.map((series) => (
          <SparklineChart key={series.id} series={series} />
        ))}
      </div>
    </section>
  );
}
