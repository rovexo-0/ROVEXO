"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchResultsEmpty } from "@/features/search/components/SearchResultsEmpty";
import { parseSearchFilters, serializeSearchFilters } from "@/features/search/utils/filters";
import { closeSearchAndReturnHome } from "@/lib/navigation/homepage-scroll-restore";
import { useIntersectionWhenVisible } from "@/lib/performance/hooks";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";

type SearchResultsResponse = {
  items: Product[];
  total: number;
  page: number;
  hasMore: boolean;
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
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || parseSearchFilters(searchParams).category;
  const hasBrowseTarget = Boolean(query) || Boolean(category);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const heading = useMemo(() => {
    if (query) return `Results for “${query}”`;
    if (category) return category.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    return "Browse listings";
  }, [category, query]);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean, signal?: AbortSignal) => {
      if (append) setIsLoadingMore(true);
      else setLoading(true);
      setError(false);

      try {
        const data = await fetchResults(query, category, nextPage, signal);
        if (signal?.aborted) return;
        setItems((current) => (append ? [...current, ...data.items] : data.items));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [category, query],
  );

  useEffect(() => {
    if (!hasBrowseTarget) return;

    const controller = new AbortController();
    startTransition(() => {
      void loadPage(1, false, controller.signal);
    });
    return () => controller.abort();
  }, [hasBrowseTarget, loadPage, startTransition]);

  useIntersectionWhenVisible(
    () => {
      startTransition(() => {
        void loadPage(page + 1, true);
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

  function handleCategoryChange(nextCategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");
    params.delete("page");
    router.replace(`/search?${params.toString()}`);
  }

  return (
    <div className="srch-results" data-search-version="v1.0-final">
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

      <div className="srch-results__filters" aria-label="Search filters">
        <label className="srch-results__filter">
          <span className="sr-only">Category</span>
          <select
            className={cn("srch-results__filter-select", focusRing)}
            value={category ?? ""}
            onChange={(event) => handleCategoryChange(event.target.value)}
          >
            <option value="">All categories</option>
            {HOME_CATEGORY_NAV.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rx-listing-grid srch-results__grid">
        {!hasBrowseTarget ? (
          <div className="col-span-full srch-results__hint">
            <p>Search above.</p>
            <Link href="/" className="srch-results__home-link">
              Home
            </Link>
          </div>
        ) : loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div role="alert" className="col-span-full srch-results__error">
            <p>Search unavailable</p>
            <button type="button" onClick={() => void loadPage(1, false)}>
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full">
            <SearchResultsEmpty variant="no-results" query={query || category || ""} entity="products" />
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
