"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { AuctionCountdown } from "@/features/auctions/components/AuctionCountdown";
import type { AuctionListing } from "@/lib/auctions/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuctionCardProps = {
  auction: AuctionListing;
  variant?: "default" | "featured";
  className?: string;
};

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

export function AuctionCard({ auction, variant = "default", className }: AuctionCardProps) {
  const href = `/listing/${auction.slug}`;
  const { isSaved, toggle } = useProductWatchlist(auction.slug);
  const currentBid = auction.auctionCurrentBid ?? auction.price;
  const isUrgent = auction.isEndingSoon;

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}${href}`;
    if (navigator.share) {
      await navigator.share({ title: auction.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
  }, [auction.title, href]);

  if (variant === "featured") {
    return (
      <article className={cn("auctions-featured-card", className)}>
        <Link href={href} className={cn("block", focusRing)}>
          <div className="auctions-featured-card__image">
            <Image src={auction.imageUrl} alt={auction.title} fill sizes="320px" className="object-cover" />
          </div>
        </Link>
        <div className="auctions-featured-card__body">
          <Link href={href} className={cn("auction-card-2026__title line-clamp-2 hover:text-primary", focusRing)}>
            {auction.title}
          </Link>
          <p className="auctions-featured-card__bid">
            Current bid <Price amount={currentBid} className="inline" />
          </p>
          <div className="auctions-featured-card__meta">
            <AuctionCountdown endsAt={auction.auctionEndsAt} urgent={isUrgent} />
            <span>{auction.bidCount} bids</span>
            <span>{auction.watchers} watching</span>
          </div>
          <Link
            href={href}
            className={cn(
              "inline-flex w-full items-center justify-center",
              buttonVariants.primary,
              buttonSizes.md,
              "auctions-btn-gradient min-h-11 border-0 text-white",
              focusRing,
            )}
          >
            Place Bid
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("auction-card-2026", className)}>
      <Link href={href} className={cn("block", focusRing)}>
        <div className="auction-card-2026__image">
          <Image src={auction.imageUrl} alt={auction.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
          {auction.isFeatured ? (
            <Badge variant="primary" className="absolute left-3 top-3">
              Featured
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="auction-card-2026__body">
        <Link href={href} className={cn("auction-card-2026__title line-clamp-2 hover:text-primary", focusRing)}>
          {auction.title}
        </Link>

        <div className="auction-card-2026__row">
          <span>
            Current bid <Price amount={currentBid} className="font-semibold text-text-primary" />
          </span>
          <AuctionCountdown endsAt={auction.auctionEndsAt} urgent={isUrgent} />
        </div>

        <div className="auction-card-2026__row">
          <span>Next min. <Price amount={auction.minNextBid} /></span>
          <span>{auction.bidCount} bids · {auction.watchers} watching</span>
        </div>

        <div className="flex items-center gap-2">
          <Avatar src={auction.sellerAvatar} name={auction.sellerName} alt={auction.sellerName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text-primary">{auction.sellerName}</p>
            <p className="text-[11px] text-text-secondary">
              Trust {auction.sellerTrustScore ?? 0}
              {auction.sellerVerified ? " · Verified" : ""}
            </p>
          </div>
          {auction.sellerVerified ? <Badge variant="success">Verified</Badge> : null}
        </div>

        <div className="auction-card-2026__actions">
          <Link
            href={href}
            className={cn(
              "inline-flex items-center justify-center",
              buttonVariants.primary,
              buttonSizes.sm,
              "auctions-btn-gradient min-h-10 border-0 text-white",
              focusRing,
            )}
          >
            Place Bid
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("auctions-btn-ghost min-h-10 px-3", isSaved && "text-primary")}
            onClick={() => toggle()}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Unwatch auction" : "Watch auction"}
          >
            {isSaved ? "Watching" : "Watch"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("auctions-btn-ghost min-h-10 px-3", focusRing)}
            onClick={() => void handleShare()}
            aria-label="Share auction"
          >
            <ShareIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
