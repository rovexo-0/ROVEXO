"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { transitionNormal } from "@/components/ui/tokens";
import type { TrustTier } from "@/lib/trust/types";

type TrustScoreMeterProps = {
  score: number;
  tier: TrustTier;
  className?: string;
  showLabel?: boolean;
  progressPercent?: number;
  nextTier?: TrustTier | null;
};

export function TrustScoreMeter({
  score,
  tier,
  className,
  showLabel = true,
  progressPercent,
  nextTier,
}: TrustScoreMeterProps) {
  const fill = Math.max(0, Math.min(100, score));
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimated(true));
    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className={cn("space-y-2", className)} aria-label={`Trust score ${score} out of 100`}>
      {showLabel && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-4xl font-bold tracking-tight text-text-primary">{score}</p>
            <p className="text-sm capitalize text-text-secondary">{tier} trust</p>
          </div>
          {nextTier && progressPercent != null && (
            <p className="text-right text-xs text-text-muted">
              {progressPercent}% to {nextTier}
            </p>
          )}
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-ds-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-ds-full bg-[image:var(--ds-gradient-primary)]",
            transitionNormal,
          )}
          style={{
            width: animated ? `${fill}%` : "0%",
          }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
