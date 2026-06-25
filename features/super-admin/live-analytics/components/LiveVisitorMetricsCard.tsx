"use client";

import type { LiveVisitorMetrics } from "@/lib/analytics/live-center/types";
import { AnimatedNumber } from "@/features/super-admin/live-analytics/components/AnimatedNumber";

type LiveVisitorMetricsCardProps = {
  metrics: LiveVisitorMetrics;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function LiveVisitorMetricsCard({ metrics }: LiveVisitorMetricsCardProps) {
  const cards = [
    { label: "Current Visitors", value: metrics.currentVisitors },
    { label: "Returning Visitors", value: metrics.returningVisitors },
    { label: "New Visitors", value: metrics.newVisitors },
    {
      label: "Avg Session Duration",
      value: metrics.averageSessionDurationSeconds,
      format: formatDuration(metrics.averageSessionDurationSeconds),
    },
    { label: "Bounce Rate", value: metrics.bounceRate, suffix: "%", decimals: 1 },
    { label: "Pages / Session", value: metrics.pagesPerSession, decimals: 1 },
  ];

  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-3">
        <h3 className="text-sm font-semibold text-text-primary">👥 Live Visitor Card</h3>
      </header>

      <div className="grid gap-ds-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-3 text-center"
          >
            <p className="text-xs text-text-secondary">{card.label}</p>
            <p className="mt-ds-1 text-xl font-bold text-text-primary">
              {"format" in card && card.format ? (
                card.format
              ) : (
                <AnimatedNumber
                  value={card.value}
                  decimals={card.decimals}
                  suffix={card.suffix}
                />
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
