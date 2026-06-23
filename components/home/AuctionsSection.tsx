"use client";

import Link from "next/link";
import { memo } from "react";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { ProductCarouselSkeleton } from "@/components/home/ProductCarouselSkeleton";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuctionsSectionProps = {
  products: Product[];
  loading?: boolean;
  error?: boolean;
};

export const AuctionsSection = memo(function AuctionsSection({
  products,
  loading = false,
  error = false,
}: AuctionsSectionProps) {
  const hasLiveAuctions = products.length > 0;

  return (
    <section aria-labelledby="auctions-heading" className="px-ds-4">
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <div>
          <h2 id="auctions-heading" className="text-lg font-semibold tracking-tight text-text-primary">
            Live auctions
          </h2>
          <p className="text-sm text-text-secondary">
            {hasLiveAuctions ? "Bid on items ending soon" : "Auctions launching across ROVEXO"}
          </p>
        </div>
        <Link href="/search?q=&sort=ending" className={cn("text-sm font-semibold text-primary", focusRing)}>
          View all
        </Link>
      </div>

      {!hasLiveAuctions && !loading && !error ? (
        <div className="rounded-ds-xl border border-dashed border-primary/25 bg-primary/5 px-ds-5 py-ds-6 text-center shadow-ds-soft">
          <p className="text-sm font-semibold text-text-primary">Coming soon</p>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Live bidding is rolling out. List an auction from the sell flow today.
          </p>
          <Link
            href="/sell"
            className={cn(
              "mt-ds-4 inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground",
              focusRing,
            )}
          >
            Create auction listing
          </Link>
        </div>
      ) : (
        <div
          className={cn(
            "-mx-ds-4 flex gap-ds-3 overflow-x-auto px-ds-4 pb-ds-1",
            "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          role={error ? "group" : "list"}
          aria-busy={loading}
          aria-live={error ? "polite" : undefined}
        >
          {loading ? (
            <ProductCarouselSkeleton count={3} />
          ) : error ? (
            <div className="min-w-full snap-start rounded-ds-xl border border-danger/50 bg-surface px-ds-5 py-ds-6 text-center text-sm font-medium text-text-primary">
              Unable to load auctions.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                role="listitem"
                className="w-[11rem] shrink-0 snap-start sm:w-[12.5rem]"
              >
                <HomeProductCard
                  {...productToCardProps(product, "homepage")}
                  layout="carousel"
                  showBidButton
                />
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
});
