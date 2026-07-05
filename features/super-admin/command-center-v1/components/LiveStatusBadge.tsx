"use client";

import { cn } from "@/lib/cn";
import type { LiveStatusBadgeVariant } from "@/features/super-admin/command-center-v1/lib/resolve-metric-display";

const BADGE_CLASS: Record<LiveStatusBadgeVariant, string> = {
  live: "cc1-live-badge--live",
  collecting: "cc1-live-badge--collecting",
  tracking: "cc1-live-badge--tracking",
  waiting: "cc1-live-badge--waiting",
  "no-data": "cc1-live-badge--no-data",
  unavailable: "cc1-live-badge--unavailable",
  secure: "cc1-live-badge--secure",
  healthy: "cc1-live-badge--healthy",
};

type LiveStatusBadgeProps = {
  label: string;
  variant: LiveStatusBadgeVariant;
  className?: string;
};

export function LiveStatusBadge({ label, variant, className }: LiveStatusBadgeProps) {
  return (
    <span className={cn("cc1-live-badge", BADGE_CLASS[variant], className)}>
      <span className="cc1-live-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
