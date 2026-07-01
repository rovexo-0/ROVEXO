"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RovexoAllListingsCard } from "@/components/home/RovexoAllListingsCard";
import { RovexoAllListingsGrid } from "@/components/home/RovexoAllListingsGrid";
import gridStyles from "@/components/home/RovexoAllListingsGrid.module.css";
import { useMarketplaceFeedColumns } from "@/components/home/hooks/useMarketplaceFeedColumns";
import { useVirtualizedFeedWindow } from "@/components/home/hooks/useVirtualizedFeedWindow";
import { HOMEPAGE_DEMO_PRODUCTS } from "@/lib/homepage/demo-data";
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
  const [items, setItems] = useState<Product[]>(
    initialPage.items.length > 0 ? initialPage.items : HOMEPAGE_DEMO_PRODUCTS.slice(0, 12),
  );
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore || initialPage.items.length === 0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const demoOffsetRef = useRef(0);
  const columnCount = useMarketplaceFeedColumns();

  const loadTriggerIndex = useMemo(
    () => Math.max(0, Math.floor(items.length * 0.75) - 1),
    [items.length],
  );

  const feedWindow = useVirtualizedFeedWindow(items.length, columnCount, gridRef);
  void feedWindow;

  const appendDemoPage = useCallback(() => {
    const nextSlice: Product[] = [];
    let cursor = demoOffsetRef.current % HOMEPAGE_DEMO_PRODUCTS.length;

    while (nextSlice.length < 12) {
      nextSlice.push({
        ...HOMEPAGE_DEMO_PRODUCTS[cursor % HOMEPAGE_DEMO_PRODUCTS.length],
        id: `demo-feed-${demoOffsetRef.current + nextSlice.length}`,
        slug: `demo-feed-${demoOffsetRef.current + nextSlice.length}`,
      });
      cursor += 1;
    }

    demoOffsetRef.current += nextSlice.length;
    setItems((current) => mergeUniqueProducts(current, nextSlice));
    setHasMore(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (!hasMore) {
        appendDemoPage();
        return;
      }

      const nextPage = page + 1;
      const response = await fetch(`/api/products?section=popular&page=${nextPage}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        appendDemoPage();
        return;
      }

      const payload = (await response.json()) as ProductsPage;

      if (payload.items.length === 0) {
        setHasMore(false);
        appendDemoPage();
        return;
      }

      setItems((current) => mergeUniqueProducts(current, payload.items));
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } finally {
      setLoading(false);
    }
  }, [appendDemoPage, hasMore, loading, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

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
  }, [items.length, loadTriggerIndex, loadMore]);

  return (
    <section aria-labelledby="all-listings-heading" className="home-v1-listing-section home-v1-all-listings">
      <div className="home-v1-listing-section__header">
        <h2 id="all-listings-heading" className="home-v1-listing-section__title">
          All Listings
        </h2>
      </div>

      <RovexoAllListingsGrid ref={gridRef}>
        {items.map((product, index) => (
          <Fragment key={product.id}>
            <RovexoAllListingsCard product={product} />
            {index === loadTriggerIndex ? (
              <div ref={sentinelRef} className={gridStyles.sentinel} aria-hidden />
            ) : null}
          </Fragment>
        ))}
      </RovexoAllListingsGrid>

      {loading ? <p className="home-v1-all-listings__loading" aria-live="polite" /> : null}
    </section>
  );
});
