"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export const AuctionsSection = memo(function AuctionsSection() {
  return (
    <section aria-labelledby="auctions-heading" className="rx-auctions-compact rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <div>
          <h2 id="auctions-heading" className="rx-section__title text-text-primary">
            Popular Auctions
          </h2>
          <p className="rx-section__subtitle">Bid on live listings from verified sellers</p>
        </div>
        <Link href="/auctions" className={cn("text-sm font-semibold text-primary", focusRing)}>
          View all
        </Link>
      </div>

      <Link
        href="/auctions"
        className={cn("rx-auctions-compact__card", focusRing)}
      >
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
    </section>
  );
});
