"use client";

import { useEffect, useState } from "react";

type CcAnimatedCounterProps = {
  value: number;
  format?: "number" | "currency" | "percent";
  durationMs?: number;
};

function formatValue(value: number, format: CcAnimatedCounterProps["format"]): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

export function CcAnimatedCounter({ value, format = "number", durationMs = 700 }: CcAnimatedCounterProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered value
  }, [value, durationMs]);

  return <span>{formatValue(display, format)}</span>;
}
