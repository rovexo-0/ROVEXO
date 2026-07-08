"use client";

type MiniSparklineProps = {
  value: number;
  max: number;
  color?: string;
};

export function MiniSparkline({
  value,
  max,
  color = "rgba(147, 51, 234, 0.85)",
}: MiniSparklineProps) {
  const width = Math.max(8, (value / Math.max(max, 1)) * 100);

  return (
    <div className="h-1.5 overflow-hidden rounded-ds-full bg-surface-muted" aria-hidden>
      <div
        className="live-analytics-bar h-full rounded-ds-full"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}
