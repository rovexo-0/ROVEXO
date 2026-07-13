"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { transitionNormal } from "@/components/ui/tokens";
import { useDocumentVisible } from "@/lib/performance/hooks";
import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";

type SellerPerformanceScoreMeterProps = {
  score: number;
  level: SellerLevel;
  className?: string;
  progressPercent?: number;
  nextLevel?: SellerLevel | null;
};

export function SellerPerformanceScoreMeter({
  score,
  level,
  className,
  progressPercent,
  nextLevel,
}: SellerPerformanceScoreMeterProps) {
  const fill = Math.max(0, Math.min(100, score));
  const [animated, setAnimated] = useState(false);
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!visible) return;

    let animateFrame = 0;
    const resetFrame = window.requestAnimationFrame(() => {
      setAnimated(false);
      animateFrame = window.requestAnimationFrame(() => setAnimated(true));
    });

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.cancelAnimationFrame(animateFrame);
    };
  }, [score, visible]);

  return (
    <div className={cn("space-y-2", className)} aria-label={`Seller score ${score} out of 100`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-4xl font-bold tracking-tight text-text-primary">{score}</p>
          <p className="text-sm text-text-secondary">{SELLER_LEVEL_LABELS[level]}</p>
        </div>
        {nextLevel && progressPercent != null && (
          <p className="text-right text-xs text-text-muted">
            {progressPercent}% to {SELLER_LEVEL_LABELS[nextLevel]}
          </p>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-ds-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-ds-full bg-[image:var(--ds-gradient-primary)]",
            transitionNormal,
          )}
          style={{ width: visible && animated ? `${fill}%` : "0%" }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
