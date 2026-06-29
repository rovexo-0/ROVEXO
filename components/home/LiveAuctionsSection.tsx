"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeAuctionCard } from "@/components/home/HomeAuctionCard";
import { PremiumEmptyStateImage } from "@/components/ui/PremiumEmptyStateImage";
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
    <section aria-labelledby="popular-auctions-heading" className="rx-auctions-compact rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <div>
          <h2 id="popular-auctions-heading" className="rx-section__title text-text-primary">
            Popular Auctions
          </h2>
          <p className="rx-section__subtitle">Bid on live listings from verified sellers</p>
        </div>
        <Link href="/auctions" className={cn("text-sm font-semibold text-primary", focusRing)}>
          View all →
        </Link>
      </div>

      {loadError ? (
        <div className="min-w-full rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
          Unable to load popular auctions.
        </div>
      ) : hasListings ? (
        <div
          className={cn(
            "rx-home-auction-scroll -mx-ds-4 px-ds-4 pb-ds-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          role="group"
          aria-roledescription="carousel"
          aria-label="Popular auctions"
        >
          {auctions.map((auction) => (
            <HomeAuctionCard key={auction.id} auction={auction} className="rx-home-auction-scroll__card" />
          ))}
        </div>
      ) : (
        <Link href="/auctions" className={cn("rx-auctions-compact__card", focusRing)}>
          <div className="rx-auctions-compact__icon">
            <PremiumEmptyStateImage id="popular-auctions" className="!h-20 !w-28" />
          </div>
          <div className="rx-auctions-compact__copy">
            <p className="rx-auctions-compact__title">Popular auctions</p>
            <p className="rx-auctions-compact__text">
              Browse active auctions and place bids on items you want.
            </p>
          </div>
        </Link>
      )}
    </section>
  );
});
