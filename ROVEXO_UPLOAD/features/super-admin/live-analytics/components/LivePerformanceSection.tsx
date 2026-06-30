"use client";

import type { LivePerformanceMetrics } from "@/lib/analytics/live-center/types";
import { AnimatedNumber } from "@/features/super-admin/live-analytics/components/AnimatedNumber";

type LivePerformanceSectionProps = {
  performance: LivePerformanceMetrics;
};

function ProgressBar({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <div className="mb-ds-1 flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <AnimatedNumber value={value} suffix={suffix} className="font-semibold text-text-primary" />
      </div>
      <div className="h-2 overflow-hidden rounded-ds-full bg-surface-muted">
        <div
          className="live-analytics-bar h-full rounded-ds-full bg-primary/80"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function LivePerformanceSection({ performance }: LivePerformanceSectionProps) {
  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-4">
        <h3 className="text-sm font-semibold text-text-primary">⚙️ Live Performance</h3>
        <p className="mt-ds-1 text-xs text-text-secondary">Realtime infrastructure metrics</p>
      </header>

      <div className="grid gap-ds-4 md:grid-cols-2">
        <ProgressBar label="CPU Usage" value={performance.cpuUsagePercent} />
        <ProgressBar label="RAM Usage" value={performance.ramUsagePercent} />
        <div>
          <div className="mb-ds-1 flex items-center justify-between text-xs">
            <span className="text-text-secondary">API Response Time</span>
            <span className="font-semibold text-text-primary">{performance.apiResponseTimeMs}ms</span>
          </div>
          <div className="h-2 overflow-hidden rounded-ds-full bg-surface-muted">
            <div
              className="live-analytics-bar h-full rounded-ds-full bg-primary/80"
              style={{ width: `${Math.min(100, performance.apiResponseTimeMs / 5)}%` }}
            />
          </div>
        </div>
        <ProgressBar label="Cache Hit Ratio" value={performance.cacheHitRatio} />
      </div>

      <div className="mt-ds-4 grid gap-ds-2 sm:grid-cols-2">
        <div className="rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-2">
          <p className="text-xs text-text-secondary">Database Connections</p>
          <AnimatedNumber
            value={performance.databaseConnections}
            className="text-lg font-bold text-text-primary"
          />
        </div>
        <div className="rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-2">
          <p className="text-xs text-text-secondary">Queue Status</p>
          <p className="text-lg font-bold text-text-primary">{performance.queueStatus}</p>
        </div>
      </div>
    </section>
  );
}
