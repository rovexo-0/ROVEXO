"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useMemo } from "react";
import { AuctionCountdown } from "@/features/auctions/components/AuctionCountdown";
import { Price } from "@/components/ui/Price";
import type { AuctionListing } from "@/lib/auctions/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeAuctionCardProps = {
  auction: AuctionListing;
  className?: string;
};

function getAuctionProgress(auction: AuctionListing): number {
  if (!auction.auctionEndsAt) return 0;

  const end = new Date(auction.auctionEndsAt).getTime();
  const start = auction.createdAtMs || end - 86_400_000;
  const now = Date.now();

  if (end <= start) return 100;

  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export const HomeAuctionCard = memo(function HomeAuctionCard({
  auction,
  className,
}: HomeAuctionCardProps) {
  const href = `/listing/${auction.slug}`;
  const currentBid = auction.auctionCurrentBid ?? auction.price;
  const progress = useMemo(() => getAuctionProgress(auction), [auction]);

  return (
    <article className={cn("rx-home-auction-card", className)}>
      <Link href={href} className={cn("rx-home-auction-card__media", focusRing)}>
        <div className="rx-home-auction-card__image">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            loading="lazy"
            sizes="(max-width: 639px) 72vw, (max-width: 1023px) 40vw, 280px"
            className="object-cover"
          />
        </div>
        <span className="rx-home-auction-card__live">LIVE</span>
        <div className="rx-home-auction-card__progress" aria-hidden>
          <span className="rx-home-auction-card__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </Link>

      <div className="rx-home-auction-card__body">
        <Link href={href} className={cn("rx-home-auction-card__title", focusRing)}>
          {auction.title}
        </Link>

        <div className="rx-home-auction-card__row">
          <AuctionCountdown endsAt={auction.auctionEndsAt} urgent={auction.isEndingSoon} />
          <span className="rx-home-auction-card__bids">{auction.bidCount} bids</span>
        </div>

        <p className="rx-home-auction-card__price">
          <span className="rx-home-auction-card__price-label">Current bid</span>
          <Price amount={currentBid} className="rx-home-auction-card__price-value" />
        </p>
      </div>
    </article>
  );
});
