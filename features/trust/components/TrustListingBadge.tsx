import Link from "next/link";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { PublicTrustSummary } from "@/lib/trust/types";

type TrustListingBadgeProps = {
  summary: PublicTrustSummary;
  className?: string;
};

export function TrustListingBadge({ summary, className }: TrustListingBadgeProps) {
  return (
    <Link
      href="/trust"
      className={cn(
        "inline-flex items-center gap-2 rounded-ds-full border border-border/80 bg-surface px-3 py-1.5 text-sm shadow-ds-soft",
        transitionFast,
        focusRing,
        "hover:border-primary/30 hover:shadow-ds-medium",
        className,
      )}
      aria-label={`Seller trust score ${summary.score}`}
    >
      <span className="font-semibold text-primary">{summary.score}</span>
      <TrustTierBadge tier={summary.tier} size="sm" />
      {summary.isLowTrust && (
        <span className="text-xs font-medium text-warning">Low trust</span>
      )}
    </Link>
  );
}
