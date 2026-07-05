"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchFilters, type SearchFilterValues } from "@/features/search/components/SearchFilters";
import { SearchResultsEmpty } from "@/features/search/components/SearchResultsEmpty";
import { SearchScopeChips } from "@/features/search/components/SearchScopeChips";
import { SellerResults } from "@/features/search/components/SellerResults";
import { parseSearchFilters, serializeSearchFilters } from "@/features/search/utils/filters";
import type { SearchFilterScope } from "@/features/search/types";
import type { SearchResults } from "@/features/search/types";
import {
  getSearchCurrentCity,
  setSearchLocationMode,
  type SearchLocationMode,
} from "@/features/search/utils/location-preference";
import { sortSearchResultItems } from "@/features/search/utils/sort-results";
import { useIntersectionWhenVisible } from "@/lib/performance/hooks";

type SearchResultsResponse = {
  items: Product[];
  total: number;
  page: number;
  hasMore: boolean;
};

async function fetchResults(
  query: string,
  filters: SearchFilterValues,
  page: number,
  signal?: AbortSignal,
): Promise<SearchResultsResponse> {
  const params = new URLSearchParams(serializeSearchFilters({ ...filters, q: query, page: String(page) }));
  const response = await fetch(`/api/search/results?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

async function fetchSellerResults(query: string, signal?: AbortSignal): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/search?${params.toString()}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const filters = parseSearchFilters(searchParams);
  const scope: SearchFilterScope = filters.scope ?? "products";

  const [items, setItems] = useState<Product[]>([]);
  const [sellerResults, setSellerResults] = useState<SearchResults | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean, signal?: AbortSignal) => {
      if (append) setIsLoadingMore(true);
      else setLoading(true);
      setError(false);

      try {
        const data = await fetchResults(query, filters, nextPage, signal);
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
    [filters, query],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(false);

      try {
        if (scope === "sellers") {
          const data = await fetchSellerResults(query, controller.signal);
          if (controller.signal.aborted) return;
          setSellerResults(data);
          setItems([]);
          setTotal(data.sellers.length + data.users.length);
          setHasMore(false);
        } else {
          const data = await fetchResults(query, filters, 1, controller.signal);
          if (controller.signal.aborted) return;
          setItems(data.items);
          setTotal(data.total);
          setPage(data.page);
          setHasMore(data.hasMore);
          setSellerResults(null);
        }
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void run();
    return () => controller.abort();
  }, [filters, query, scope]);

  useIntersectionWhenVisible(
    () => {
      startTransition(() => {
        void loadPage(page + 1, true);
      });
    },
    {
      targetRef: loadMoreRef,
      enabled: scope === "products" && hasMore && !isLoadingMore,
      rootMargin: "240px",
    },
  );

  function updateFilters(next: SearchFilterValues) {
    const params = serializeSearchFilters({ ...next, q: query });
    router.replace(`/search?${params.toString()}`);
  }

  function updateScope(nextScope: SearchFilterScope) {
    updateFilters({ ...filters, scope: nextScope });
  }

  function handleLocationChange(mode: SearchLocationMode, city?: string) {
    setSearchLocationMode(mode);
    const nextLocation = mode === "current" || mode === "nearby" ? city : undefined;
    updateFilters({ ...filters, location: nextLocation });
  }

  const displayedItems = useMemo(() => {
    if (filters.sort !== "most_viewed" && filters.sort !== "nearest") return items;
    return sortSearchResultItems(items, filters.sort, filters.location ?? getSearchCurrentCity() ?? undefined);
  }, [filters.location, filters.sort, items]);

  return (
    <div className="flex flex-col gap-ds-5">
      <div className="min-h-[3.75rem]">
        <h1 className="text-xl font-semibold text-text-primary">
          {query ? `Results for “${query}”` : "Browse listings"}
        </h1>
        {!loading && !error && scope === "products" && (
          <p className="mt-ds-1 text-sm text-text-secondary">
            {total.toLocaleString()} {total === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      <SearchScopeChips active={scope} onChange={updateScope} query={query} />
      <SearchFilters
        values={filters}
        onChange={updateFilters}
        onLocationChange={handleLocationChange}
      />

      <div className="rx-listing-grid min-h-[24rem] px-ds-4">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div
            role="alert"
            className="col-span-full rounded-ds-xl border border-danger/30 bg-danger/5 px-ds-5 py-ds-8 text-center"
          >
            <p className="text-sm font-medium text-text-primary">Search unavailable</p>
            <button
              type="button"
              onClick={() => void loadPage(1, false)}
              className="mt-ds-3 text-sm font-semibold text-primary"
            >
              Try again
            </button>
          </div>
        ) : scope === "sellers" && sellerResults ? (
          sellerResults.sellers.length + sellerResults.users.length === 0 ? (
            <div className="col-span-full">
              <SearchResultsEmpty variant="no-results" query={query} entity="sellers" />
            </div>
          ) : (
            <div className="col-span-full">
              <SellerResults
                sellers={sellerResults.sellers}
                users={sellerResults.users}
                activeIndex={-1}
                navOffset={0}
                onHoverIndex={() => undefined}
                onNavigate={() => undefined}
              />
            </div>
          )
        ) : items.length === 0 ? (
          <div className="col-span-full">
            <SearchResultsEmpty variant="no-results" query={query} entity="products" />
          </div>
        ) : (
          displayedItems.map((product) => (
            <ListingCard key={product.id} product={product} variant="grid" surface="search" />
          ))
        )}
        {isLoadingMore && <ProductGridSkeleton count={4} />}
      </div>
      <div ref={loadMoreRef} className="h-ds-2" aria-hidden />
    </div>
  );
}
