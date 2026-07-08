"use client";

import { Card } from "@/components/ui/Card";
import type { PerformanceSnapshot } from "@/lib/super-admin/operations/types";

function MetricChart({ title, values, color }: { title: string; values: number[]; color: string }) {
  const max = Math.max(...values, 1);

  return (
    <Card padding="md" className="rx-surface-card border border-border/80">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <div className="mt-ds-4 flex h-28 items-end gap-ds-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex flex-1 flex-col items-center gap-ds-1">
            <div
              className="w-full rounded-t-ds-sm"
              style={{
                height: `${Math.max(8, (value / max) * 100)}%`,
                background: color,
              }}
              aria-hidden
            />
            <span className="text-[10px] text-text-muted">{Math.round(value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AiPerformanceSection({ performance }: { performance: PerformanceSnapshot }) {
  const statCards = [
    { label: "CPU", value: `${performance.cpuPercent}%` },
    { label: "RAM", value: `${performance.memoryPercent}%` },
    { label: "Disk", value: `${performance.diskPercent}%` },
    { label: "API Latency", value: `${performance.apiLatencyMs}ms` },
    { label: "Response Time", value: `${performance.responseTimeMs}ms` },
    { label: "Requests/min", value: performance.requestsPerMinute.toLocaleString() },
    { label: "Error Rate", value: `${performance.errorRate}%` },
  ];

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Performance Center</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">Platform resource usage and request metrics.</p>

      <div className="mt-ds-4 grid gap-ds-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="sm" className="rx-glass text-center">
            <p className="text-xs text-text-secondary">{stat.label}</p>
            <p className="mt-ds-1 text-lg font-bold text-text-primary">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-ds-4 grid gap-ds-3 lg:grid-cols-3">
        <MetricChart title="API Latency" values={performance.history.apiLatency} color="rgba(147,51,234,0.75)" />
        <MetricChart title="Requests" values={performance.history.requests} color="rgba(16,185,129,0.75)" />
        <MetricChart title="Errors" values={performance.history.errors} color="rgba(239,68,68,0.75)" />
      </div>
    </section>
  );
}
