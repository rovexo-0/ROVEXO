"use client";

import { memo, useEffect, useState } from "react";
import { useDocumentVisible } from "@/lib/performance/hooks";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  format?: (value: number) => string;
};

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  duration = 700,
  format = (next) => next.toLocaleString("en-GB"),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!visible) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, value, visible]);

  return <span className="tabular-nums">{format(displayValue)}</span>;
});
