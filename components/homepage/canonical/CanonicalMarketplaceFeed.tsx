"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import {
  HP_CANONICAL_LISTING_PROPS,
  HP_FEED_LISTING_IMAGE_SIZES,
} from "@/components/homepage/canonical/constants";
import { CanonicalFeedSkeletonGrid } from "@/components/homepage/canonical/CanonicalFeedSkeleton";
import { HomepageEmptyState } from "@/components/homepage/canonical/HomepageEmptyState";
import { useMarketplaceFeedColumns } from "@/components/home/hooks/useMarketplaceFeedColumns";
import type { Product, ProductsPage } from "@/lib/products/types";
import type { CSSProperties } from "react";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";
import { shareInflightJson } from "@/lib/performance/fetch";

type CanonicalMarketplaceFeedProps = {
  initialPage: ProductsPage;
  reservedIds?: string[];
  /**
   * P0-01-A — when true, only the first feed card may be the homepage LCP image.
   * Must be false whenever Featured Store / Showcase already owns the single LCP slot.
   */
  lcpImagePriority?: boolean;
};

const EMPTY_RESERVED_IDS: string[] = [];

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
  return initialPage.items.filter((product) => !reserved.has(product.id));
}

export const CanonicalMarketplaceFeed = memo(function CanonicalMarketplaceFeed({
  initialPage,
  reservedIds = EMPTY_RESERVED_IDS,
  lcpImagePriority = false,
}: CanonicalMarketplaceFeedProps) {
  const reserved = useMemo(() => new Set(reservedIds), [reservedIds]);
  const seedItems = useMemo(
    () => resolveSeedItems(initialPage, reserved),
    [initialPage, reserved],
  );

  const [items, setItems] = useState<Product[]>(seedItems);
  const [page, setPage] = useState(initialPage.page);
  // SSOT: trust API `hasMore` only. Never force true from seed length —
  // that mounted the infinite-scroll sentinel inside the CSS grid as a blank slot
  // whenever the last page had any items (e.g. 5 cards → empty 6th cell).
  const [hasMore, setHasMore] = useState(Boolean(initialPage.hasMore));
  // SSR page 1 is canonical — do not refetch it. Empty seed is authoritative.
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const columnCount = useMarketplaceFeedColumns();

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
        let payload: ProductsPage;
        if (targetPage === 1 && mode === "replace") {
          // P3: coalesce Strict Mode / remount page-1 (short soft TTL; public catalog).
          payload = await shareInflightJson<ProductsPage>(
            "GET:/api/homepage/feed?page=1",
            "/api/homepage/feed?page=1",
            { ttlMs: 500 },
          );
        } else {
          const response = await fetch(`/api/homepage/feed?page=${targetPage}`, {
            cache: "no-store",
          });
          if (!response.ok) {
            feedDebugLog("fetch:error", { targetPage, status: response.status });
            setHasMore(false);
            return;
          }
          payload = (await response.json()) as ProductsPage;
        }

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
        setHasMore(Boolean(payload.hasMore));
      } catch {
        feedDebugLog("fetch:error", { targetPage, mode });
        setHasMore(false);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [reserved],
  );

  // Infinite scroll — advances beyond page 1 only while more pages remain.
  const loadMore = useCallback(() => {
    if (fetchingRef.current) return;
    if (!hasMore) return;
    void loadPage(page + 1, "append");
  }, [hasMore, loadPage, page]);

  /**
   * Page 1 is already loaded by SSR (`loadHomepageDocumentData`).
   * Do not fetch `/api/homepage/feed?page=1` again on hydrate.
   * Infinite scroll still loads page 2+.
   */
  useEffect(() => {
    feedDebugLog("ssr-seed", {
      initialItems: initialPage.items.length,
      seedItems: seedItems.length,
      initialHasMore: initialPage.hasMore,
    });
  }, [initialPage.items.length, initialPage.hasMore, seedItems.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || items.length === 0 || !hasMore) return;

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
  }, [items.length, hasMore, loadMore]);

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
            <ListingCard
              key={product.id}
              product={product}
              variant="grid"
              {...HP_CANONICAL_LISTING_PROPS}
              imageSizes={HP_FEED_LISTING_IMAGE_SIZES}
              /* P0-01-A: at most one homepage LCP listing; never when Showcase owns it. */
              priority={lcpImagePriority && index === 0}
            />
          ))
        )}
      </div>
      {/* Sentinel MUST stay outside the CSS grid — an in-grid child becomes a blank slot. */}
      {hasMore && !showInitialSkeleton ? (
        <div ref={sentinelRef} className={css.feedSentinel} aria-hidden />
      ) : null}
      {loading && items.length > 0 ? (
        <p className={css.feedLoading} role="status" aria-live="polite">
          Loading more listings…
        </p>
      ) : null}
    </section>
  );
});
