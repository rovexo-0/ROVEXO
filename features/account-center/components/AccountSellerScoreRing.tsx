"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type AccountSellerScoreRingProps = {
  score: number;
  className?: string;
};

export function AccountSellerScoreRing({ score, className }: AccountSellerScoreRingProps) {
  const gradientId = useId().replace(/:/g, "");
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (normalized / 100) * circumference;

  const [strokeOffset, setStrokeOffset] = useState(circumference);
  const [animateRing, setAnimateRing] = useState(false);
  const previousScore = useRef<number | null>(null);

  useEffect(() => {
    if (previousScore.current === null) {
      setStrokeOffset(targetOffset);
      previousScore.current = normalized;
      return;
    }

    if (previousScore.current !== normalized) {
      setAnimateRing(true);
      setStrokeOffset(targetOffset);
      previousScore.current = normalized;
    }
  }, [normalized, targetOffset]);

  return (
    <div
      className={cn(
        "ac-canonical__seller-score-ring",
        animateRing && "ac-canonical__seller-score-ring--animate",
        className,
      )}
      role="img"
      aria-label={`Seller score ${normalized} out of 100`}
    >
      <svg viewBox="0 0 64 64" className="ac-canonical__seller-score-ring-svg" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle
          className="ac-canonical__seller-score-ring-track"
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
        />
        <circle
          className="ac-canonical__seller-score-ring-progress"
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="ac-canonical__seller-score-ring-copy">
        <span className="ac-canonical__seller-score-ring-value">{normalized}</span>
        <span className="ac-canonical__seller-score-ring-max">/100</span>
      </div>
    </div>
  );
}
