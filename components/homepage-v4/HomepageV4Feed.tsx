"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP4_LISTING_CARD_PROPS } from "@/components/homepage-v4/constants";
import { HomepageV4SkeletonGrid } from "@/components/homepage-v4/HomepageV4Skeleton";
import { useMarketplaceFeedColumns } from "@/components/home/hooks/useMarketplaceFeedColumns";
import { HOMEPAGE_DEMO_PRODUCTS } from "@/lib/homepage/demo-data";
import { isClosedBetaHomepageMode } from "@/lib/homepage/config";
import type { Product, ProductsPage } from "@/lib/products/types";
import type { CSSProperties } from "react";

type HomepageV4FeedProps = {
  initialPage: ProductsPage;
  reservedIds?: string[];
};

const STATIC_DEMO_FALLBACK =
  process.env.NEXT_PUBLIC_ROVEXO_HOMEPAGE_DEMO === "1" && !isClosedBetaHomepageMode();

function mergeUniqueProducts(current: Product[], incoming: Product[], reserved: Set<string>): Product[] {
  const seen = new Set([...reserved, ...current.map((item) => item.id)]);
  const merged = [...current];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

function resolveSeedItems(initialPage: ProductsPage, reserved: Set<string>): Product[] {
  const fromServer = initialPage.items.filter((product) => !reserved.has(product.id));
  if (fromServer.length > 0) return fromServer;

  if (STATIC_DEMO_FALLBACK) {
    return HOMEPAGE_DEMO_PRODUCTS.filter((product) => !reserved.has(product.id)).slice(0, 12);
  }

  return [];
}

export const HomepageV4Feed = memo(function HomepageV4Feed({
  initialPage,
  reservedIds = [],
}: HomepageV4FeedProps) {
  const reserved = useMemo(() => new Set(reservedIds), [reservedIds]);
  const seedItems = useMemo(
    () => resolveSeedItems(initialPage, reserved),
    [initialPage, reserved],
  );

  const [items, setItems] = useState<Product[]>(seedItems);
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore || seedItems.length > 0);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const demoOffsetRef = useRef(seedItems.length);
  const columnCount = useMarketplaceFeedColumns();

  const loadTriggerIndex = useMemo(
    () => Math.max(0, Math.floor(items.length * 0.75) - 1),
    [items.length],
  );

  const appendDemoPage = useCallback(() => {
    const nextSlice: Product[] = [];
    let cursor = demoOffsetRef.current % HOMEPAGE_DEMO_PRODUCTS.length;

    while (nextSlice.length < 12) {
      const source = HOMEPAGE_DEMO_PRODUCTS[cursor % HOMEPAGE_DEMO_PRODUCTS.length];
      const id = `demo-feed-${demoOffsetRef.current + nextSlice.length}`;
      if (!reserved.has(id)) {
        nextSlice.push({
          ...source,
          id,
          slug: id,
        });
      }
      cursor += 1;
    }

    demoOffsetRef.current += nextSlice.length;
    setItems((current) => mergeUniqueProducts(current, nextSlice, reserved));
    setHasMore(true);
  }, [reserved]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      if (!hasMore) {
        if (STATIC_DEMO_FALLBACK) appendDemoPage();
        return;
      }

      const nextPage = items.length === 0 ? 1 : page + 1;
      const response = await fetch(`/api/homepage/feed?page=${nextPage}`, { cache: "no-store" });

      if (!response.ok) {
        if (STATIC_DEMO_FALLBACK) appendDemoPage();
        else setHasMore(false);
        return;
      }

      const payload = (await response.json()) as ProductsPage;

      if (payload.items.length === 0) {
        setHasMore(false);
        if (STATIC_DEMO_FALLBACK) appendDemoPage();
        return;
      }

      setItems((current) => mergeUniqueProducts(current, payload.items, reserved));
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [appendDemoPage, hasMore, items.length, page, reserved]);

  useEffect(() => {
    if (seedItems.length === 0) return;
    setItems((current) => (current.length > 0 ? current : seedItems));
  }, [seedItems]);

  useEffect(() => {
    if (items.length > 0) return;
    void loadMore();
  }, [items.length, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "280px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, loadTriggerIndex, loadMore]);

  if (items.length === 0 && !loading) {
    return null;
  }

  const showInitialSkeleton = loading && items.length === 0;

  return (
    <section aria-label="Marketplace feed" className="rx4-feed">
      <div
        className="rx4-feed__grid"
        data-homepage-listing-container="grid"
        style={{ "--rx4-grid-cols": columnCount } as CSSProperties}
      >
        {showInitialSkeleton ? (
          <HomepageV4SkeletonGrid count={columnCount * 2} />
        ) : (
          items.map((product, index) => (
            <Fragment key={product.id}>
              <ListingCard
                product={product}
                variant="grid"
                priority={index < 2}
                {...HP4_LISTING_CARD_PROPS}
              />
              {index === loadTriggerIndex ? (
                <div ref={sentinelRef} className="rx4-feed__sentinel" aria-hidden />
              ) : null}
            </Fragment>
          ))
        )}
      </div>
    </section>
  );
});
