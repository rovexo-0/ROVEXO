"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HOMEPAGE_LISTING_CARD_PROPS } from "@/components/home/constants";
import { HomeListingCardSkeletonGrid } from "@/components/home/HomeListingCardSkeleton";
import { RovexoAllListingsGrid } from "@/components/home/RovexoAllListingsGrid";
import gridStyles from "@/components/home/RovexoAllListingsGrid.module.css";
import { useMarketplaceFeedColumns } from "@/components/home/hooks/useMarketplaceFeedColumns";
import type { Product, ProductsPage } from "@/lib/products/types";

type RovexoAllListingsProps = {
  initialPage: ProductsPage;
};

function mergeUniqueProducts(current: Product[], incoming: Product[]): Product[] {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export const RovexoAllListings = memo(function RovexoAllListings({
  initialPage,
}: RovexoAllListingsProps) {
  const [items, setItems] = useState<Product[]>(initialPage.items);
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(initialPage.items.length === 0);
  const [bootstrapped, setBootstrapped] = useState(initialPage.items.length > 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const columnCount = useMarketplaceFeedColumns();

  const loadTriggerIndex = useMemo(
    () => Math.max(0, Math.floor(items.length * 0.75) - 1),
    [items.length],
  );

  const loadMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (!hasMore) return;

      const nextPage = items.length === 0 ? 1 : page + 1;
      const response = await fetch(`/api/homepage/feed?page=${nextPage}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setHasMore(false);
        return;
      }

      const payload = (await response.json()) as ProductsPage;

      if (payload.items.length === 0) {
        setHasMore(false);
        return;
      }

      setItems((current) => mergeUniqueProducts(current, payload.items));
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setBootstrapped(true);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, items.length]);

  useEffect(() => {
    if (bootstrapped) return;

    if (initialPage.items.length > 0) {
      setBootstrapped(true);
      setLoading(false);
      return;
    }

    void loadMore();
  }, [bootstrapped, initialPage.items.length, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !bootstrapped) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [bootstrapped, items.length, loadTriggerIndex, loadMore]);

  if (!loading && items.length === 0 && bootstrapped) {
    return null;
  }

  return (
    <section
      id="home-v1-all-listings"
      aria-label="Marketplace listings"
      className="home-v1-listing-section home-v1-all-listings"
    >
      <RovexoAllListingsGrid ref={gridRef} columns={columnCount}>
        {loading && items.length === 0 ? (
          <HomeListingCardSkeletonGrid count={4} />
        ) : (
          items.map((product, index) => (
            <Fragment key={product.id}>
              <ListingCard
                product={product}
                variant="grid"
                priority={index < 2}
                {...HOMEPAGE_LISTING_CARD_PROPS}
              />
              {index === loadTriggerIndex ? (
                <div ref={sentinelRef} className={gridStyles.sentinel} aria-hidden />
              ) : null}
            </Fragment>
          ))
        )}
        {loading && items.length > 0 ? <HomeListingCardSkeletonGrid count={2} /> : null}
      </RovexoAllListingsGrid>
    </section>
  );
});
