"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { SearchResultsEmpty } from "@/features/search/components/SearchResultsEmpty";
import { SearchSuggestionList } from "@/features/search/components/SearchSuggestionList";
import { LoadingSkeleton } from "@/features/search/components/LoadingSkeleton";
import { ProductResults } from "@/features/search/components/ProductResults";
import { CategoryResults } from "@/features/search/components/CategoryResults";
import { StoreResults } from "@/features/search/components/StoreResults";
import { SellerResults } from "@/features/search/components/SellerResults";
import { SearchSection } from "@/features/search/components/SearchSection";
import { TrendingSearches } from "@/features/search/components/TrendingSearches";
import { useSearchKeyboard } from "@/features/search/hooks/use-search-keyboard";
import { useSearchResults } from "@/features/search/hooks/use-search-results";
import { addSearchHistory } from "@/features/search/utils/history";
import { buildSearchNavItems, SEARCH_PRIMARY_PRODUCT_COUNT } from "@/features/search/utils/keyboard-items";
import { hasSearchResults } from "@/features/search/utils/search-client";
import { SEARCH_ENGINE_V1 } from "@/lib/search/search-engine-v1";

type SearchTypeaheadPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  className?: string;
};

/**
 * Live typeahead for /search — same engine as former overlay typing mode.
 * Idle SEARCH_UI_v1.0 stays in SearchLandingView; this mounts only while typing.
 */
export function SearchTypeaheadPanel({
  query,
  onQueryChange,
  className,
}: SearchTypeaheadPanelProps) {
  const router = useRouter();
  const {
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    isLoadingMore,
    isDebouncing,
    isTooShort,
    hasQuery,
    loadMoreProducts,
  } = useSearchResults(query);

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const applySearch = useCallback(
    (term: string) => {
      const normalized = term.trim();
      if (!normalized) return;
      onQueryChange(normalized);
      setQuery(normalized);
      setHistory(addSearchHistory(normalized));
    },
    [onQueryChange, setQuery],
  );

  const saveCurrentQuery = useCallback(() => {
    if (debouncedQuery.trim()) {
      setHistory(addSearchHistory(debouncedQuery));
    }
  }, [debouncedQuery]);

  const handleResultNavigate = useCallback(() => {
    saveCurrentQuery();
  }, [saveCurrentQuery]);

  const suggestionTerms = useMemo(() => {
    if (!results || !hasQuery) return [] as string[];
    const terms: string[] = [];
    for (const product of results.products.slice(0, 6)) {
      if (product.title.trim()) terms.push(product.title.trim());
    }
    for (const brand of results.brands.slice(0, 3)) {
      if (brand.name.trim()) terms.push(brand.name.trim());
    }
    return [...new Set(terms)].slice(0, 8);
  }, [hasQuery, results]);

  const navItems = useMemo(
    () =>
      buildSearchNavItems({
        results,
        history,
        hasQuery,
        onSelectTerm: applySearch,
        onSelectQuery: handleResultNavigate,
        suggestionTerms,
      }),
    [results, history, hasQuery, applySearch, handleResultNavigate, suggestionTerms],
  );

  const { activeIndex, setActiveIndex, handleKeyDown } = useSearchKeyboard(navItems, debouncedQuery);

  const showNoResults =
    hasQuery && !isDebouncing && !isLoading && results && !hasSearchResults(results);

  const suggestionOffset = 0;
  const productOffset = suggestionTerms.length;
  const categoryQueryOffset =
    productOffset + Math.min(SEARCH_PRIMARY_PRODUCT_COUNT, results?.products.length ?? 0);
  const storeQueryOffset = categoryQueryOffset + (results?.categories.length ?? 0);
  const memberOffset = storeQueryOffset + (results?.stores.length ?? 0);
  const similarOffset = memberOffset + (results?.users.length ?? 0);

  return (
    <div
      className={cn("srch-typeahead", className)}
      data-search-engine={SEARCH_ENGINE_V1.version}
      data-search-typeahead="v1"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Search suggestions"
    >
      {(isDebouncing || isLoading) && hasQuery ? <LoadingSkeleton /> : null}

      {isTooShort && !isDebouncing ? (
        <p className="px-ds-4 py-ds-3 text-sm text-text-secondary" role="status">
          Type at least 2 characters to search.
        </p>
      ) : null}

      {hasQuery && !isDebouncing && !isLoading && results ? (
        <>
          {suggestionTerms.length > 0 ? (
            <SearchSection title="Suggestions">
              <TrendingSearches
                items={suggestionTerms}
                activeIndex={activeIndex}
                navOffset={suggestionOffset}
                onSelect={applySearch}
              />
            </SearchSection>
          ) : null}

          <SearchSection title="Products">
            <SearchSuggestionList
              results={results}
              query={debouncedQuery}
              activeIndex={activeIndex}
              navOffset={productOffset}
              onHoverIndex={setActiveIndex}
              onNavigate={handleResultNavigate}
              maxProducts={SEARCH_PRIMARY_PRODUCT_COUNT}
              kinds={["product"]}
            />
          </SearchSection>

          {results.categories.length > 0 ? (
            <SearchSection title="Relevant Categories">
              <div className="px-ds-4 py-ds-2">
                <CategoryResults
                  items={results.categories}
                  activeIndex={activeIndex}
                  navOffset={categoryQueryOffset}
                  onHoverIndex={setActiveIndex}
                  onNavigate={handleResultNavigate}
                />
              </div>
            </SearchSection>
          ) : null}

          {results.stores.length > 0 ? (
            <SearchSection title="Relevant Stores">
              <div className="px-ds-4 py-ds-2">
                <StoreResults
                  items={results.stores}
                  activeIndex={activeIndex}
                  navOffset={storeQueryOffset}
                  onHoverIndex={setActiveIndex}
                  onNavigate={handleResultNavigate}
                />
              </div>
            </SearchSection>
          ) : null}

          {results.users.length > 0 ? (
            <SearchSection title="Relevant Members">
              <div className="px-ds-4 py-ds-2">
                <SellerResults
                  sellers={[]}
                  users={results.users}
                  activeIndex={activeIndex}
                  navOffset={memberOffset}
                  onHoverIndex={setActiveIndex}
                  onNavigate={handleResultNavigate}
                />
              </div>
            </SearchSection>
          ) : null}

          {results.products.length > SEARCH_PRIMARY_PRODUCT_COUNT ? (
            <SearchSection title="Similar Products">
              <ProductResults
                items={results.products.slice(SEARCH_PRIMARY_PRODUCT_COUNT)}
                query={debouncedQuery}
                activeIndex={activeIndex}
                navOffset={similarOffset}
                hasMore={results.productsHasMore}
                isLoadingMore={isLoadingMore}
                onHoverIndex={setActiveIndex}
                onNavigate={handleResultNavigate}
                onLoadMore={() => void loadMoreProducts()}
              />
            </SearchSection>
          ) : null}

          {results.products.length <= SEARCH_PRIMARY_PRODUCT_COUNT &&
          results.productsHasMore &&
          results.products.length > 0 ? (
            <div className="px-ds-4 py-ds-2">
              <button
                type="button"
                onClick={() => void loadMoreProducts()}
                disabled={isLoadingMore}
                className="text-sm font-semibold text-primary"
              >
                {isLoadingMore ? "Loading…" : "Load more products"}
              </button>
            </div>
          ) : null}

          {hasSearchResults(results) ? (
            <div className="border-t border-border px-ds-4 py-ds-3">
              <button
                type="button"
                className="text-sm font-semibold text-primary"
                onClick={() => {
                  saveCurrentQuery();
                  router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                }}
              >
                View all results
              </button>
            </div>
          ) : null}

          {showNoResults ? (
            <SearchResultsEmpty variant="no-results" query={debouncedQuery} entity="products" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
