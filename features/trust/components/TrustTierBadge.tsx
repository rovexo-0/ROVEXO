"use client";

import { cn } from "@/lib/cn";
import { TRUST_TIER_LABELS } from "@/lib/trust/constants";
import type { TrustTier } from "@/lib/trust/types";
import { TRUST_TIER_COLORS } from "@/lib/trust/types";

type TrustTierBadgeProps = {
  tier: TrustTier;
  className?: string;
  size?: "sm" | "md";
};

const tierStyles: Record<TrustTier, string> = {
  bronze: "border-amber-700/40 bg-amber-950/30 text-amber-300",
  silver: "border-zinc-500/40 bg-zinc-800/40 text-zinc-200",
  gold: "border-yellow-500/40 bg-yellow-950/20 text-yellow-300",
  platinum: "border-sky-400/40 bg-sky-950/20 text-sky-200",
  diamond: "border-cyan-400/40 bg-cyan-950/25 text-cyan-200",
};

export function TrustTierBadge({ tier, className, size = "md" }: TrustTierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-ds-full border font-semibold capitalize",
        tierStyles[tier],
        TRUST_TIER_COLORS[tier],
        size === "sm" ? "px-2 py-0.5 text-[0.625rem]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {TRUST_TIER_LABELS[tier]}
    </span>
  );
}
