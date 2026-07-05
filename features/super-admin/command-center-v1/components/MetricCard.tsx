"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CommandCenterMetric } from "@/lib/super-admin/command-center-v1/types";
import { resolveMetricDisplay } from "@/features/super-admin/command-center-v1/lib/resolve-metric-display";
import { LiveStatusBadge } from "@/features/super-admin/command-center-v1/components/LiveStatusBadge";

const TONE_CLASS: Record<NonNullable<CommandCenterMetric["tone"]>, string> = {
  healthy: "cc1-metric--healthy",
  info: "cc1-metric--info",
  warning: "cc1-metric--warning",
  critical: "cc1-metric--critical",
  analytics: "cc1-metric--analytics",
  marketplace: "cc1-metric--marketplace",
};

type MetricCardProps = {
  metric: CommandCenterMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  const display = resolveMetricDisplay(metric);
  const tooltipId = `cc1-metric-tip-${metric.id}`;

  const content = (
    <article
      className={cn("cc1-metric", metric.tone ? TONE_CLASS[metric.tone] : undefined)}
      aria-label={display.ariaLabel}
      title={display.tooltip}
      aria-describedby={tooltipId}
    >
      <p className="cc1-metric__label">{metric.label}</p>
      <p
        className={cn(
          "cc1-metric__value",
          display.kind === "empty" ? "cc1-metric__value--empty" : undefined,
        )}
      >
        {display.displayText}
      </p>
      {display.badge ? (
        <LiveStatusBadge label={display.badge.label} variant={display.badge.variant} className="cc1-metric__badge" />
      ) : null}
      <span id={tooltipId} className="cc1-sr-only">
        {display.tooltip}
      </span>
      {typeof metric.delta === "number" && metric.delta !== 0 ? (
        <p className="cc1-metric__delta">
          {metric.delta > 0 ? "+" : ""}
          {metric.delta} today
        </p>
      ) : null}
    </article>
  );

  if (metric.href) {
    return (
      <Link href={metric.href} className="cc1-metric-link" title={display.tooltip}>
        {content}
      </Link>
    );
  }

  return content;
}
