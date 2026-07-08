"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";

export type CcDonutSegment = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type CcDonutChartProps = {
  segments: CcDonutSegment[];
  centerLabel?: string;
  className?: string;
};

export const CcDonutChart = memo(function CcDonutChart({
  segments,
  centerLabel,
  className,
}: CcDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments.reduce<Array<{ segment: CcDonutSegment; length: number; offset: number }>>((acc, segment) => {
    const length = (segment.value / total) * circumference;
    const offset = acc.reduce((sum, item) => sum + item.length, 0);
    acc.push({ segment, length, offset });
    return acc;
  }, []);

  return (
    <div className={cn("cc2-donut", className)}>
      <div className="cc2-donut__ring">
        <svg viewBox="0 0 140 140" className="cc2-donut__svg" role="img" aria-label="Donut chart">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="16" />
          <g transform="rotate(-90 70 70)">
            {arcs.map(({ segment, length, offset }) => (
              <circle
                key={segment.id}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>
        <div className="cc2-donut__center">
          <strong>{centerLabel ?? total.toLocaleString("en-GB")}</strong>
        </div>
      </div>
      <ul className="cc2-donut__legend">
        {segments.map((segment) => {
          const percent = Math.round((segment.value / total) * 1000) / 10;
          return (
            <li key={segment.id}>
              <span className="cc2-donut__swatch" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
              <strong>{percent}%</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
