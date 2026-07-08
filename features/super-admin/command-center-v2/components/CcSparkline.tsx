"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

type CcSparklineProps = {
  points: number[];
  className?: string;
  stroke?: string;
  fill?: string;
  height?: number;
};

export function CcSparkline({
  points,
  className,
  stroke = "currentColor",
  fill = "rgba(99, 102, 241, 0.15)",
  height = 32,
}: CcSparklineProps) {
  const geometry = useMemo(() => {
    if (!points.length) {
      return null;
    }
    const width = 120;
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = Math.max(max - min, 1);

    const coords = points.map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / range) * (height - 4) + 2;
      return [x, y] as const;
    });

    const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area, width };
  }, [points, height]);

  if (!geometry) {
    return <svg viewBox={`0 0 120 ${height}`} className={cn("cc2-sparkline", className)} aria-hidden />;
  }

  return (
    <svg viewBox={`0 0 ${geometry.width} ${height}`} className={cn("cc2-sparkline", className)} aria-hidden>
      <path d={geometry.area} fill={fill} />
      <path d={geometry.line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
