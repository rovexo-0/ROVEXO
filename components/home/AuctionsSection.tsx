"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export const AuctionsSection = memo(function AuctionsSection() {
  return (
    <section aria-labelledby="auctions-heading" className="px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <div>
          <h2 id="auctions-heading" className="home-section-2026__title text-text-primary">
            Auctions
          </h2>
          <p className="text-sm text-text-secondary">Bid on live listings from verified sellers</p>
        </div>
        <Link href="/auctions" className={cn("text-sm font-semibold text-primary", focusRing)}>
          Learn more
        </Link>
      </div>

      <Link
        href="/auctions"
        className={cn(
          "flex items-center gap-ds-4 rounded-ds-xl border border-dashed border-primary/25 bg-primary/5 px-ds-5 py-ds-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.07]",
          focusRing,
        )}
      >
        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-ds-lg bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <HomeCategoryIconImage type="auctions" className="h-14 w-14" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold text-text-primary">Live auctions</p>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Browse active auctions and place bids on items you want.
          </p>
        </div>
      </Link>
    </section>
  );
});
