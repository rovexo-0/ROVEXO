"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products/types";

type ProductRecentlyViewedProps = {
  currentSlug: string;
};

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
      <div className="pd-v1__recent-rail" role="list">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/listing/${item.slug}`}
            className="pd-v1__recent-thumb"
            role="listitem"
            aria-label={item.title}
          >
            <SafeImage src={item.imageUrl} alt="" fill loading="lazy" sizes="72px" className="object-cover" />
          </Link>
        ))}
      </div>
    </section>
  );
}
