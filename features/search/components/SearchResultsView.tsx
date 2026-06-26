"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { ProductGridSkeleton, ProductSectionEmpty } from "@/components/home/ProductSectionStates";
import { SearchFilters, type SearchFilterValues } from "@/features/search/components/SearchFilters";
import { parseSearchFilters, serializeSearchFilters } from "@/features/search/utils/filters";
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

export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const filters = parseSearchFilters(searchParams);

  const [items, setItems] = useState<Product[]>([]);
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
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
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
        const data = await fetchResults(query, filters, 1, controller.signal);
        if (controller.signal.aborted) return;
        setItems(data.items);
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void run();
    return () => controller.abort();
  }, [filters, query]);

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

  function updateFilters(next: SearchFilterValues) {
    const params = serializeSearchFilters({ ...next, q: query });
    router.replace(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-ds-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {query ? `Results for “${query}”` : "Browse listings"}
        </h1>
        {!loading && !error && (
          <p className="mt-ds-1 text-sm text-text-secondary">
            {total.toLocaleString()} {total === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      <SearchFilters values={filters} onChange={updateFilters} />

      <div className="marketplace-listing-grid px-ds-4">
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
        ) : items.length === 0 ? (
          <ProductSectionEmpty
            title="results"
            message="Try different keywords or adjust your filters."
          />
        ) : (
          items.map((product) => (
            <ProductCard key={product.id} {...productToCardProps(product)} />
          ))
        )}
        {isLoadingMore && <ProductGridSkeleton count={4} />}
      </div>
      <div ref={loadMoreRef} className="h-ds-2" aria-hidden />
    </div>
  );
}
