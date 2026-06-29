"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { HomeAuctionCard } from "@/components/home/HomeAuctionCard";
import {
  HOME_LAUNCH_SECTION_CARD_LIMIT,
  HOME_LAUNCH_VIEW_ALL_HREFS,
  HOME_LAUNCH_VIEW_ALL_LABEL,
} from "@/components/home/home-launch-config";
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
  const visibleAuctions = useMemo(
    () => auctions.slice(0, HOME_LAUNCH_SECTION_CARD_LIMIT),
    [auctions],
  );

  if (loadError || visibleAuctions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="popular-auctions-heading" className="rx-auctions-compact rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <h2 id="popular-auctions-heading" className="rx-section__title text-text-primary">
          Popular Auctions
        </h2>
        <Link
          href={HOME_LAUNCH_VIEW_ALL_HREFS.auctions}
          className={cn("shrink-0 text-sm font-semibold text-primary hover:opacity-80", focusRing)}
        >
          {HOME_LAUNCH_VIEW_ALL_LABEL}
        </Link>
      </div>

      <div
        className={cn(
          "rx-home-launch-scroll rx-home-launch-scroll--auctions -mx-ds-4 px-ds-4 pb-ds-1",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="group"
        aria-roledescription="carousel"
        aria-label="Popular auctions"
      >
        {visibleAuctions.map((auction) => (
          <HomeAuctionCard key={auction.id} auction={auction} className="rx-home-auction-scroll__card" />
        ))}
      </div>
    </section>
  );
});
