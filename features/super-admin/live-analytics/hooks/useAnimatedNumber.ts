import { useEffect, useRef, useState } from "react";
import { isDocumentVisible } from "@/lib/performance/visibility";

export function useAnimatedNumber(value: number, durationMs = 600): number {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef({ from: value, startedAt: 0 });

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const from = display;
    const to = value;
    if (from === to) return;

    if (!isDocumentVisible()) {
      setDisplay(to);
      return;
    }

    startRef.current = { from, startedAt: performance.now() };

    const tick = (now: number) => {
      if (!isDocumentVisible()) {
        setDisplay(to);
        return;
      }

      const elapsed = now - startRef.current.startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = startRef.current.from + (to - startRef.current.from) * eased;
      setDisplay(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from latest rendered value
  }, [value, durationMs]);

  return Math.round(display * 10) / 10;
}
