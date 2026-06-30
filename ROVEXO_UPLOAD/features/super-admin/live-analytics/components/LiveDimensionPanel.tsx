"use client";

import { cn } from "@/lib/cn";
import type { LiveDimensionRow } from "@/lib/analytics/live-center/types";
import { AnimatedNumber } from "@/features/super-admin/live-analytics/components/AnimatedNumber";
import { MiniSparkline } from "@/features/super-admin/live-analytics/components/MiniSparkline";

type LiveDimensionPanelProps = {
  title: string;
  icon: string;
  rows: LiveDimensionRow[];
  emptyLabel?: string;
};

export function LiveDimensionPanel({
  title,
  icon,
  rows,
  emptyLabel = "No active data",
}: LiveDimensionPanelProps) {
  const max = Math.max(...rows.map((row) => row.activeUsers), 1);

  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-3 flex items-center gap-ds-2">
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </header>

      {rows.length === 0 ? (
        <p className="py-ds-4 text-center text-sm text-text-secondary">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-ds-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "live-analytics-fade-in rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-2",
              )}
            >
              <div className="flex items-center justify-between gap-ds-2">
                <p className="truncate text-sm font-medium text-text-primary">{row.label}</p>
                <div className="flex shrink-0 items-center gap-ds-2">
                  <AnimatedNumber value={row.activeUsers} className="text-sm font-bold tabular-nums" />
                  <span className="text-xs text-text-muted">{row.percentage}%</span>
                </div>
              </div>
              <div className="mt-ds-2">
                <MiniSparkline value={row.activeUsers} max={max} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
