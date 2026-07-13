import type { SellerPerformanceHistoryPoint } from "@/lib/seller-performance/types";

type SellerPerformanceHistoryChartProps = {
  points: SellerPerformanceHistoryPoint[];
  className?: string;
};

export function SellerPerformanceHistoryChart({
  points,
  className,
}: SellerPerformanceHistoryChartProps) {
  if (!points.length) {
    return (
      <p className="text-sm text-text-muted">Score history will appear after your first recalculation.</p>
    );
  }

  const width = 640;
  const height = 160;
  const padding = 12;
  const scores = points.map((point) => point.score);
  const min = Math.max(0, Math.min(...scores) - 5);
  const max = Math.min(100, Math.max(...scores) + 5);
  const span = Math.max(1, max - min);

  const coords = points.map((point, index) => {
    const x =
      padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((point.score - min) / span) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Seller score history graph"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
        points={coords.join(" ")}
      />
    </svg>
  );
}
