"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResults } from "@/features/search/types";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
  SEARCH_PRODUCT_PAGE_SIZE,
} from "@/features/search/types";
import { fetchSearchResults } from "@/features/search/utils/fetch-search";
import { mergeProductResults } from "@/features/search/utils/search-client";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { trackGaEvent } from "@/lib/analytics/ga4-events";

export function useSearchResults(initialQuery = "", locationCity?: string) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const trimmedDebounced = debouncedQuery.trim();
  const isDebouncing = query.trim().length > 0 && debouncedQuery !== query;
  const isTooShort = trimmedDebounced.length > 0 && trimmedDebounced.length < SEARCH_MIN_CHARS;
  const hasQuery = trimmedDebounced.length >= SEARCH_MIN_CHARS;

  const loadResults = useCallback(
    async (searchQuery: string, offset = 0, append = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await fetchSearchResults({
          query: searchQuery,
          productOffset: offset,
          productLimit: SEARCH_PRODUCT_PAGE_SIZE,
          locationCity,
          signal: controller.signal,
        });

        setResults((current) => {
          if (append && current) {
            return mergeProductResults(current, data);
          }
          return data;
        });

        if (!append && searchQuery.trim()) {
          trackGaEvent("search", { search_term: searchQuery.trim() });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults(null);
        }
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [locationCity],
  );

  useEffect(() => {
    if (isTooShort) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function runSearch() {
      setIsLoading(true);

      try {
        const data = await fetchSearchResults({
          query: debouncedQuery,
          productOffset: 0,
          productLimit: SEARCH_PRODUCT_PAGE_SIZE,
          locationCity,
          signal: controller.signal,
        });

        setResults(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void runSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isTooShort, locationCity]);

  const loadMoreProducts = useCallback(async () => {
    if (!results?.productsHasMore || isLoadingMore || isLoading || !hasQuery) return;
    await loadResults(debouncedQuery, results.productsOffset, true);
  }, [results, isLoadingMore, isLoading, hasQuery, debouncedQuery, loadResults]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results: isTooShort ? null : results,
    isLoading,
    isLoadingMore,
    isDebouncing,
    isTooShort,
    hasQuery,
    loadMoreProducts,
  };
}
