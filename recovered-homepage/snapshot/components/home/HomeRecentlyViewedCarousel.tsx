"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export const HomeContinueBrowsingCarousel = memo(function HomeContinueBrowsingCarousel() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/recently-viewed")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: Product[] } | null) => setItems(payload?.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section aria-labelledby="continue-browsing-heading" className="rx-section px-ds-4">
      <div className="mb-ds-2 flex items-end justify-between gap-ds-2">
        <h2 id="continue-browsing-heading" className="rx-section__title text-text-primary">
          Recently Viewed
        </h2>
        <Link href="/saved" className={cn("text-sm font-semibold text-primary hover:opacity-80", focusRing)}>
          View all →
        </Link>
      </div>

      <div
        className="rx-listing-carousel -mx-ds-4 px-ds-4 pb-ds-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-roledescription="carousel"
        aria-label="Continue browsing listings"
      >
        {items.map((product) => (
          <HomeProductCard key={product.id} {...productToCardProps(product, "homepage")} />
        ))}
      </div>
    </section>
  );
});

/** @deprecated Use HomeContinueBrowsingCarousel */
export const HomeRecentlyViewedCarousel = HomeContinueBrowsingCarousel;
