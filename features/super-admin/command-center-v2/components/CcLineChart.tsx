"use client";

import { memo, useMemo, useState } from "react";

type CcLineChartProps = {
  points: number[];
  labels?: string[];
  height?: number;
  stroke?: string;
  fill?: string;
  title?: string;
};

type HoverPoint = {
  index: number;
  x: number;
  y: number;
  value: number;
};

export const CcLineChart = memo(function CcLineChart({
  points,
  labels,
  height = 180,
  stroke = "#818cf8",
  fill = "rgba(129, 140, 248, 0.18)",
  title,
}: CcLineChartProps) {
  const [hover, setHover] = useState<HoverPoint | null>(null);
  const width = 640;

  const geometry = useMemo(() => {
    if (!points.length) {
      return { line: "", area: "", coords: [] as Array<{ x: number; y: number; value: number }> };
    }

    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = Math.max(max - min, 1);
    const coords = points.map((value, index) => ({
      x: (index / Math.max(points.length - 1, 1)) * width,
      y: height - ((value - min) / range) * (height - 20) + 10,
      value,
    }));

    const line = coords
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;

    return { line, area, coords };
  }, [points, height, width]);

  return (
    <div className="cc2-line-chart">
      {title ? <p className="cc2-line-chart__title">{title}</p> : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="cc2-line-chart__svg"
        role="img"
        aria-label={title ?? "Line chart"}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const relativeX = ((event.clientX - rect.left) / rect.width) * width;
          let nearest = 0;
          let nearestDistance = Number.POSITIVE_INFINITY;
          geometry.coords.forEach((point, index) => {
            const distance = Math.abs(point.x - relativeX);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearest = index;
            }
          });
          const point = geometry.coords[nearest];
          if (point) setHover({ index: nearest, ...point });
        }}
      >
        <defs>
          <linearGradient id="cc2-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
          </linearGradient>
        </defs>
        {geometry.area ? <path d={geometry.area} fill="url(#cc2-line-fill)" /> : null}
        {geometry.line ? (
          <path d={geometry.line} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {hover ? (
          <>
            <line x1={hover.x} x2={hover.x} y1={0} y2={height} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 4" />
            <circle cx={hover.x} cy={hover.y} r="5" fill={stroke} stroke="#0b0e14" strokeWidth="2" />
          </>
        ) : null}
      </svg>
      {hover ? (
        <div className="cc2-line-chart__tooltip">
          <strong>{hover.value.toLocaleString("en-GB")}</strong>
          {labels?.[hover.index] ? <span>{labels[hover.index]}</span> : null}
        </div>
      ) : null}
    </div>
  );
});
