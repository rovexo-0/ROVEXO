"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { SearchLandingView } from "@/features/search/components/SearchLandingView";
import type { SearchLandingCategoryCount } from "@/features/search/components/SearchLandingView";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { MarketplaceNoProductsEmpty } from "@/features/search/components/MarketplaceNoProductsEmpty";
import { SearchBarSearchIcon } from "@/features/search/components/SearchBarIcons";
import { parseSearchFilters, serializeSearchFilters } from "@/features/search/utils/filters";
import { closeSearchAndReturnHome } from "@/lib/navigation/homepage-scroll-restore";
import { useIntersectionWhenVisible } from "@/lib/performance/hooks";
import { SEARCH_MIN_CHARS } from "@/features/search/types";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";
import { subscribeSearchListingsRealtime } from "@/lib/realtime/search-listings-realtime";
import { focusRing } from "@/components/ui/tokens";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type SearchResultsResponse = {
  items: Product[];
  total: number;
  page: number;
  hasMore: boolean;
};

type SearchResultsViewProps = {
  categoryCounts?: SearchLandingCategoryCount[];
  trending?: string[];
};

async function fetchResults(
  query: string,
  category: string | undefined,
  page: number,
  signal?: AbortSignal,
): Promise<SearchResultsResponse> {
  const params = new URLSearchParams(
    serializeSearchFilters({ category, q: query, page: String(page) }),
  );
  const response = await fetch(`/api/search/results?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

function CloseIcon({ className }: { className?: string }) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.close} size={18} className={className} />;
}

function BackIcon({ className }: { className?: string }) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.back} size={18} className={className} />;
}

export function SearchResultsView({
  categoryCounts = [],
  trending = [],
}: SearchResultsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || parseSearchFilters(searchParams).category;
  const hasBrowseTarget = Boolean(query) || Boolean(category);

  const [items, setItems] = useState<Product[]>([]);
  const [rtTick, setRtTick] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  /** P2: page-1 / realtime abort must not share ownership with load-more. */
  const page1AbortRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  const heading = useMemo(() => {
    if (query) return `Results for “${query}”`;
    if (category) return category.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    return "Browse listings";
  }, [category, query]);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean, controller: AbortController) => {
      if (append) setIsLoadingMore(true);
      else {
        setLoading(true);
        setIsLoadingMore(false);
      }
      setError(false);

      try {
        const data = await fetchResults(query, category, nextPage, controller.signal);
        if (controller.signal.aborted) return;
        setItems((current) => (append ? [...current, ...data.items] : data.items));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(true);
      } finally {
        // Only the latest request of this kind may clear its own loading flag.
        if (append) {
          if (loadMoreAbortRef.current === controller) setIsLoadingMore(false);
        } else if (page1AbortRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [category, query],
  );

  useEffect(() => {
    if (!hasBrowseTarget) return;

    page1AbortRef.current?.abort();
    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();
    page1AbortRef.current = controller;
    startTransition(() => {
      void loadPage(1, false, controller);
    });
    return () => {
      page1AbortRef.current?.abort();
      loadMoreAbortRef.current?.abort();
    };
  }, [hasBrowseTarget, loadPage, startTransition]);

  /* Realtime Certification — listing publish/pause/delete updates results without F5. */
  useEffect(() => {
    if (!hasBrowseTarget) return;
    const sub = subscribeSearchListingsRealtime(() => {
      setRtTick((tick) => tick + 1);
      page1AbortRef.current?.abort();
      loadMoreAbortRef.current?.abort();
      const controller = new AbortController();
      page1AbortRef.current = controller;
      startTransition(() => {
        void loadPage(1, false, controller);
      });
    });
    return () => sub.unsubscribe();
  }, [hasBrowseTarget, loadPage, startTransition]);

  useIntersectionWhenVisible(
    () => {
      loadMoreAbortRef.current?.abort();
      const controller = new AbortController();
      loadMoreAbortRef.current = controller;
      startTransition(() => {
        void loadPage(page + 1, true, controller);
      });
    },
    {
      targetRef: loadMoreRef,
      enabled: hasMore && !isLoadingMore,
      rootMargin: "240px",
    },
  );

  function handleClose() {
    closeSearchAndReturnHome((href) => router.push(href));
  }

  function handleEmptySearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const normalized = String(form.get("q") ?? "").trim();
    if (normalized.length < SEARCH_MIN_CHARS) return;
    const params = new URLSearchParams();
    params.set("q", normalized);
    router.replace(`/search?${params.toString()}`);
  }

  if (!hasBrowseTarget) {
    return (
      <SearchLandingView
        categoryCounts={categoryCounts}
        trending={trending}
        surface="search"
      />
    );
  }

  const showCanonicalEmpty = !loading && !error && items.length === 0;

  if (showCanonicalEmpty) {
    return (
      <div
        className="srch-results srch-results--empty"
        data-search-version="v1.0-final"
        data-empty-state="no-products-v1"
        data-search-rt-tick={rtTick}
      >
        <div className="srch-results__empty-chrome">
          <button
            type="button"
            className={cn("srch-results__empty-back", focusRing)}
            aria-label="Go back"
            onClick={handleClose}
          >
            <BackIcon className="srch-results__empty-back-icon" />
          </button>
          <form
            key={query}
            className="srch-results__empty-bar"
            role="search"
            onSubmit={handleEmptySearchSubmit}
          >
            <span className="srch-results__empty-bar-icon" aria-hidden>
              <SearchBarSearchIcon />
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={SEARCH_SYSTEM_V1.placeholder}
              className="srch-results__empty-bar-input"
              aria-label={SEARCH_SYSTEM_V1.placeholder}
              autoComplete="off"
              enterKeyHint="search"
            />
          </form>
        </div>
        <div className="srch-results__empty-body">
          <MarketplaceNoProductsEmpty />
        </div>
      </div>
    );
  }

  return (
    <div className="srch-results"
      data-search-version="v1.0-final"
      data-ui-polish-phase1="search-v1"
      data-search-rt-tick={rtTick}
    >
      <div className="srch-results__top">
        <button
          type="button"
          className={cn("srch-results__close", focusRing)}
          aria-label="Close search and return to homepage"
          onClick={handleClose}
        >
          <CloseIcon className="srch-results__close-icon" />
        </button>
        <div className="srch-results__heading">
          <h1 className="srch-results__title">{heading}</h1>
          {!loading && !error && hasBrowseTarget ? (
            <p className="srch-results__count">
              {total.toLocaleString()} {total === 1 ? "result" : "results"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rx-listing-grid srch-results__grid">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div role="alert" className="col-span-full srch-results__error">
            <p>Search unavailable</p>
            <button
              type="button"
              className={cn("srch-results__error-retry", focusRing)}
              onClick={() => {
                page1AbortRef.current?.abort();
                loadMoreAbortRef.current?.abort();
                const controller = new AbortController();
                page1AbortRef.current = controller;
                startTransition(() => {
                  void loadPage(1, false, controller);
                });
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          items.map((product) => (
            <ListingCard key={product.id} product={product} variant="grid" {...HP_CANONICAL_LISTING_PROPS} />
          ))
        )}
        {isLoadingMore ? <ProductGridSkeleton count={4} /> : null}
      </div>
      <div ref={loadMoreRef} className="h-ds-2" aria-hidden />
    </div>
  );
}
