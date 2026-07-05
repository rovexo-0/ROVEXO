"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SkeletonFadeProps = {
  /** When true, the skeleton is shown. When false, real content fades in. */
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
  /** Fade duration in ms (spec: 200–300ms). */
  durationMs?: number;
};

/**
 * Cross-fades from a skeleton to real content for client components that fetch
 * their own data (route-level loading.tsx does not need this — Next swaps the
 * skeleton for the page automatically). Both layers are stacked and the swap is
 * a pure opacity transition, so there is no repaint or layout shift. The
 * transition is CSS-only (GPU friendly) with no state or effects.
 */
export function SkeletonFade({
  loading,
  skeleton,
  children,
  className,
  durationMs = 240,
}: SkeletonFadeProps) {
  const transition = `opacity ${durationMs}ms linear`;

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "transition-opacity",
          loading ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
        )}
        style={{ transition }}
      >
        {skeleton}
      </div>
      <div
        className={cn("transition-opacity", loading ? "pointer-events-none opacity-0" : "opacity-100")}
        style={{ transition }}
      >
        {children}
      </div>
    </div>
  );
}
