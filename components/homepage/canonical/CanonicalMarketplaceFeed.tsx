"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { CanonicalFeedSkeletonGrid } from "@/components/homepage/canonical/CanonicalFeedSkeleton";
import { HomepageEmptyState } from "@/components/homepage/canonical/HomepageEmptyState";
import { useMarketplaceFeedColumns } from "@/components/home/hooks/useMarketplaceFeedColumns";
import { HOMEPAGE_DEMO_PRODUCTS } from "@/lib/homepage/demo-data";
import { isClosedBetaHomepageMode } from "@/lib/homepage/config";
import type { Product, ProductsPage } from "@/lib/products/types";
import type { CSSProperties } from "react";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

type CanonicalMarketplaceFeedProps = {
  initialPage: ProductsPage;
  reservedIds?: string[];
};

const STATIC_DEMO_FALLBACK =
  process.env.NEXT_PUBLIC_ROVEXO_HOMEPAGE_DEMO === "1" && !isClosedBetaHomepageMode();

/** Opt-in pipeline tracing (set NEXT_PUBLIC_HOMEPAGE_FEED_DEBUG=1). No-op in prod. */
const FEED_DEBUG = process.env.NEXT_PUBLIC_HOMEPAGE_FEED_DEBUG === "1";
function feedDebugLog(step: string, data: Record<string, unknown>): void {
  if (!FEED_DEBUG) return;
  console.log(`[homepage-feed] ${step}`, data);
}

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

export const CanonicalMarketplaceFeed = memo(function CanonicalMarketplaceFeed({
  initialPage,
  reservedIds = [],
}: CanonicalMarketplaceFeedProps) {
  const reserved = useMemo(() => new Set(reservedIds), [reservedIds]);
  const seedItems = useMemo(
    () => resolveSeedItems(initialPage, reserved),
    [initialPage, reserved],
  );

  const [items, setItems] = useState<Product[]>(seedItems);
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore || seedItems.length > 0);
  // When SSR seeded zero items we intend to fetch page 1 immediately, so the
  // very first render must show the loading skeleton — never the empty state.
  const [loading, setLoading] = useState(seedItems.length === 0);
  const fetchingRef = useRef(false);
  // The page-1 reconciliation fetch runs exactly once per mount. Guards against
  // re-fetch loops and repeated reconciliation on unrelated re-renders.
  const initialFetchDoneRef = useRef(false);
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

  /**
   * Canonical fetch: retrieves an exact page from /api/homepage/feed. `mode`
   * decides whether the page REPLACES the current first page (mount-time
   * reconciliation) or APPENDS to it (infinite scroll). The feed API is the
   * single source of truth — the homepage always renders what it returns.
   */
  const loadPage = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      feedDebugLog("fetch:start", { targetPage, mode });
      try {
        const response = await fetch(`/api/homepage/feed?page=${targetPage}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          feedDebugLog("fetch:error", { targetPage, status: response.status });
          if (STATIC_DEMO_FALLBACK && mode === "replace") appendDemoPage();
          else if (mode === "append") setHasMore(false);
          return;
        }

        const payload = (await response.json()) as ProductsPage;
        const fetchedItems = payload.items.filter((product) => !reserved.has(product.id));
        feedDebugLog("fetch:response", {
          targetPage,
          mode,
          fetchedItems: fetchedItems.length,
          hasMore: payload.hasMore,
        });

        if (fetchedItems.length === 0) {
          // Only page 1 (replace) is authoritative about emptiness.
          if (mode === "replace") {
            setItems([]);
            setPage(1);
          }
          setHasMore(false);
          if (STATIC_DEMO_FALLBACK) appendDemoPage();
          return;
        }

        setItems((current) => {
          const base = mode === "replace" ? [] : current;
          const mergedItems = mergeUniqueProducts(base, fetchedItems, reserved);
          feedDebugLog("merge", {
            mode,
            before: current.length,
            incoming: fetchedItems.length,
            mergedItems: mergedItems.length,
          });
          return mergedItems;
        });
        setPage(payload.page);
        setHasMore(payload.hasMore);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [appendDemoPage, reserved],
  );

  // Infinite scroll — advances beyond page 1 only while more pages remain.
  const loadMore = useCallback(() => {
    if (fetchingRef.current) return;
    if (!hasMore) {
      if (STATIC_DEMO_FALLBACK) appendDemoPage();
      return;
    }
    void loadPage(page + 1, "append");
  }, [appendDemoPage, hasMore, loadPage, page]);

  /**
   * ROOT-CAUSE FIX: the SSR seed can be stale (ISR `revalidate`) — empty when
   * the DB was cleared, or a partial page from before a publish. So on mount the
   * client ALWAYS fetches page 1 and REPLACES the seed with the authoritative
   * API result. This guarantees the grid matches `/api/homepage/feed` exactly
   * and never shows a stale set (or "No Listings Yet") while the API has data.
   * Runs exactly once.
   */
  useEffect(() => {
    if (initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;
    feedDebugLog("initial-reconcile", {
      initialItems: initialPage.items.length,
      seedItems: seedItems.length,
      initialHasMore: initialPage.hasMore,
    });
    void loadPage(1, "replace");
  }, [initialPage.items.length, initialPage.hasMore, seedItems.length, loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "280px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, loadTriggerIndex, loadMore]);

  useEffect(() => {
    feedDebugLog("render-state", {
      seedItems: seedItems.length,
      renderedItems: items.length,
      hasMore,
      loading,
      page,
    });
  }, [seedItems.length, items.length, hasMore, loading, page]);

  if (items.length === 0 && !loading) {
    return <HomepageEmptyState variant="listings" />;
  }

  const showInitialSkeleton = loading && items.length === 0;

  return (
    <section aria-label="Marketplace feed">
      <div
        className={css.feedGrid}
        data-homepage-listing-container="grid"
        style={{ "--hp-grid-cols": columnCount } as CSSProperties}
      >
        {showInitialSkeleton ? (
          <CanonicalFeedSkeletonGrid count={columnCount * 2} />
        ) : (
          items.map((product, index) => (
            <Fragment key={product.id}>
              <ListingCard
                product={product}
                variant="grid"
                priority={index < 2}
                {...HP_CANONICAL_LISTING_PROPS}
              />
              {index === loadTriggerIndex ? (
                <div ref={sentinelRef} className={css.feedSentinel} aria-hidden />
              ) : null}
            </Fragment>
          ))
        )}
      </div>
      {loading && items.length > 0 ? (
        <p className={css.feedLoading} role="status" aria-live="polite">
          Loading more listings…
        </p>
      ) : null}
    </section>
  );
});
