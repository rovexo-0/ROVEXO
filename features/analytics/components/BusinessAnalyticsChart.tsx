"use client";

import { niceAxisMax, pickChartTickIndexes } from "@/lib/analytics/business-analytics-v1";
import type { BusinessAnalyticsChart } from "@/lib/analytics/types";

type BusinessAnalyticsChartProps = {
  chart: BusinessAnalyticsChart;
  formatY: (value: number) => string;
};

export function BusinessAnalyticsChart({ chart, formatY }: BusinessAnalyticsChartProps) {
  const width = 320;
  const height = 168;
  const padL = 36;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxValue = niceAxisMax(Math.max(0, ...chart.points.map((point) => point.value)));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio);
  const xTicks = pickChartTickIndexes(chart.points.length);
  const coords = chart.points.map((point, index) => {
    const x =
      chart.points.length <= 1
        ? padL + innerW / 2
        : padL + (index / (chart.points.length - 1)) * innerW;
    const y = padT + innerH - (point.value / maxValue) * innerH;
    return { x, y, point };
  });
  const line = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`).join(" ");
  const area =
    coords.length === 0
      ? ""
      : `${line} L${coords[coords.length - 1].x} ${padT + innerH} L${coords[0].x} ${padT + innerH} Z`;

  return (
    <section className="biz-analytics__chart" data-analytics-chart={chart.title}>
      <div className="biz-analytics__chart-head">
        <h2>{chart.title}</h2>
        <p>
          <span aria-hidden>—</span> {chart.totalLabel}
        </p>
      </div>
      <svg
        className="biz-analytics__chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${chart.title} ${chart.totalLabel}`}
      >
        <defs>
          <linearGradient id="biz-analytics-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = padT + innerH - (tick / maxValue) * innerH;
          return (
            <g key={tick}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} className="biz-analytics__chart-grid" />
              <text x={padL - 6} y={y + 3} className="biz-analytics__chart-y">
                {formatY(tick)}
              </text>
            </g>
          );
        })}
        {area ? <path d={area} className="biz-analytics__chart-fill" /> : null}
        {line ? <path d={line} className="biz-analytics__chart-line" /> : null}
        {xTicks.map((index) => {
          const coord = coords[index];
          if (!coord) return null;
          return (
            <text
              key={coord.point.date}
              x={coord.x}
              y={height - 8}
              className="biz-analytics__chart-x"
            >
              {coord.point.label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}
