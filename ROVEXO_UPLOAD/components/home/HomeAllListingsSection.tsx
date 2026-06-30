"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PremiumListingCard } from "@/components/home/PremiumProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product, ProductsPage } from "@/lib/products/types";
import { cn } from "@/lib/cn";

type HomeAllListingsSectionProps = {
  initialPage: ProductsPage;
};

export const HomeAllListingsSection = memo(function HomeAllListingsSection({
  initialPage,
}: HomeAllListingsSectionProps) {
  const [items, setItems] = useState<Product[]>(initialPage.items);
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/products?section=popular&page=${nextPage}`, {
        cache: "force-cache",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as ProductsPage;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        const merged = [...current];
        for (const item of payload.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="all-listings-heading" className="rx-section rx-home-all-listings px-ds-4">
      <div className="mb-ds-2">
        <h2 id="all-listings-heading" className="rx-section__title text-text-primary">
          All Listings
        </h2>
      </div>

      <div className="rx-home-all-listings-grid">
        {items.map((product) => (
          <PremiumListingCard
            key={product.id}
            {...productToCardProps(product, "homepage")}
            className="rx-home-all-listings-grid__card"
          />
        ))}
      </div>

      <div ref={sentinelRef} className={cn("rx-home-all-listings__sentinel", loading && "is-loading")} aria-hidden />
    </section>
  );
});
