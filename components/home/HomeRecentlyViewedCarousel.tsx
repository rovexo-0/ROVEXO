"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function HomeRecentlyViewedCarousel() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/recently-viewed")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: Product[] } | null) => setItems(payload?.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="px-ds-4">
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <h2 id="recently-viewed-heading" className="text-lg font-semibold tracking-tight text-text-primary">
          Recently Viewed
        </h2>
        <Link href="/saved" className={cn("text-sm font-semibold text-primary hover:opacity-80", focusRing)}>
          View all
        </Link>
      </div>

      <div
        className={cn(
          "-mx-ds-4 flex gap-ds-3 overflow-x-auto px-ds-4 pb-ds-1",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        role="list"
      >
        {items.map((product) => (
          <div
            key={product.id}
            role="listitem"
            className="w-[10.5rem] shrink-0 snap-start sm:w-[12.5rem]"
          >
            <HomeProductCard {...productToCardProps(product, "homepage")} layout="carousel" />
          </div>
        ))}
      </div>
    </section>
  );
}
