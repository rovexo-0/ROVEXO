import { TrustListingBadge } from "@/features/trust/components/TrustListingBadge";
import type { PublicTrustSummary } from "@/lib/trust/types";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type ProductSellerCardProps = {
  sellerId: string;
  sellerName: string;
  sellerUsername?: string | null;
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  sellerTrust?: PublicTrustSummary | null;
  className?: string;
};

export function ProductSellerCard({
  sellerName,
  sellerUsername,
  sellerAvatar,
  rating,
  reviewCount,
  salesCount,
  sellerTrust,
  className,
}: ProductSellerCardProps) {
  const profileHref = sellerUsername ? `/user/${sellerUsername}` : "/search";

  return (
    <Card padding="lg" className={cn("shadow-ds-soft", className)}>
      <h2 className="mb-ds-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Seller
      </h2>
      <Link
        href={profileHref}
        className={cn("flex items-center gap-ds-3 rounded-ds-lg p-ds-1", transitionFast, focusRing)}
      >
        <Avatar src={sellerAvatar} alt={sellerName} name={sellerName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">{sellerName}</p>
          {sellerUsername && (
            <p className="truncate text-sm text-text-secondary">@{sellerUsername}</p>
          )}
          <div className="mt-ds-1">
            <Rating value={rating} reviewCount={reviewCount} size="sm" />
          </div>
          <p className="mt-ds-1 text-xs text-text-secondary">
            {salesCount.toLocaleString()} sales
          </p>
          {sellerTrust && (
            <div className="mt-ds-2">
              <TrustListingBadge summary={sellerTrust} />
            </div>
          )}
        </div>
      </Link>
      <div className="mt-ds-4 flex flex-col gap-ds-2">
        <Link
          href={profileHref}
          className="inline-flex min-h-ds-7 w-full items-center justify-center rounded-ds-full border border-border text-sm font-semibold text-text-primary hover:border-primary/30 hover:text-primary"
        >
          View shop
        </Link>
      </div>
    </Card>
  );
}
