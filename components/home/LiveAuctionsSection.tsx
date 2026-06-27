"use client";

import Link from "next/link";
import { memo } from "react";
import { AuctionCard } from "@/features/auctions/components/AuctionCard";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import type { AuctionListing } from "@/lib/auctions/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type LiveAuctionsSectionProps = {
  auctions: AuctionListing[];
  loadError?: boolean;
};

export const LiveAuctionsSection = memo(function LiveAuctionsSection({
  auctions,
  loadError = false,
}: LiveAuctionsSectionProps) {
  const hasListings = auctions.length > 0;

  return (
    <section aria-labelledby="live-auctions-heading" className="rx-auctions-compact rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <div>
          <h2 id="live-auctions-heading" className="rx-section__title text-text-primary">
            Live Auctions
          </h2>
          <p className="rx-section__subtitle">Bid on live listings from verified sellers</p>
        </div>
        <Link href="/auctions" className={cn("text-sm font-semibold text-primary", focusRing)}>
          View all
        </Link>
      </div>

      {loadError ? (
        <div className="min-w-full rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
          Unable to load live auctions.
        </div>
      ) : hasListings ? (
        <div
          className={cn(
            "rx-auction-carousel -mx-ds-4 px-ds-4 pb-ds-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          role="group"
          aria-roledescription="carousel"
          aria-label="Live auctions"
        >
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} className="rx-auction-carousel__card" />
          ))}
        </div>
      ) : (
        <Link href="/auctions" className={cn("rx-auctions-compact__card", focusRing)}>
          <div className="rx-auctions-compact__icon">
            <HomeCategoryIconImage type="auctions" className="!h-11 !w-11" />
          </div>
          <div className="rx-auctions-compact__copy">
            <p className="rx-auctions-compact__title">Live auctions</p>
            <p className="rx-auctions-compact__text">
              Browse active auctions and place bids on items you want.
            </p>
          </div>
        </Link>
      )}
    </section>
  );
});
