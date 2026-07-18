"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { Product } from "@/lib/products/types";

type ProductRecentlyViewedProps = {
  currentSlug: string;
};

/** Recently viewed — Master Two Column Policy (mobile 2-col listing grid). */
export function ProductRecentlyViewed({ currentSlug }: ProductRecentlyViewedProps) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/recently-viewed")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: Product[] } | null) => {
        const filtered = (payload?.items ?? []).filter((item) => item.slug !== currentSlug).slice(0, 8);
        setItems(filtered);
      })
      .catch(() => setItems([]));
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pd-recent-title">
      <div className="pd-v1__section-head">
        <h2 id="pd-recent-title" className="pd-v1__section-title">
          Recently viewed
        </h2>
        <Link href="/saved?sort=recently-viewed" className="pd-v1__section-link">
          See all
        </Link>
      </div>
      <div className="rx-listing-grid px-0" role="list" aria-label="Recently viewed listings">
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <ListingCard
              product={item}
              variant="grid"
              {...HP_CANONICAL_LISTING_PROPS}
              surface="recently-viewed"
              showSeller={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
