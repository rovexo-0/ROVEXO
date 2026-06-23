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
        "premium-chip inline-flex items-center gap-2 px-3 py-1.5 text-sm",
        transitionFast,
        focusRing,
        "hover:border-primary/30",
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
