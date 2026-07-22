"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { SearchResultsEmpty } from "@/features/search/components/SearchResultsEmpty";
import { SearchInputActions } from "@/features/search/components/SearchInputActions";
import { SearchSuggestionList } from "@/features/search/components/SearchSuggestionList";
import { LoadingSkeleton } from "@/features/search/components/LoadingSkeleton";
import { ProductResults } from "@/features/search/components/ProductResults";
import { RecentSearches } from "@/features/search/components/RecentSearches";
import { CategoryResults } from "@/features/search/components/CategoryResults";
import { StoreResults } from "@/features/search/components/StoreResults";
import { SellerResults } from "@/features/search/components/SellerResults";
import { SearchSection } from "@/features/search/components/SearchSection";
import { TrendingSearches } from "@/features/search/components/TrendingSearches";
import { useSearchKeyboard } from "@/features/search/hooks/use-search-keyboard";
import { useSearchResults } from "@/features/search/hooks/use-search-results";
import type { SearchOverlayProps } from "@/features/search/types";
import { SEARCH_TRANSITION_MS } from "@/features/search/types";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";
import {
  captureHomepageScroll,
  closeSearchAndReturnHome,
  restoreHomepageScroll,
} from "@/lib/navigation/homepage-scroll-restore";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from "@/features/search/utils/history";
import { buildSearchNavItems } from "@/features/search/utils/keyboard-items";
import { hasSearchResults } from "@/features/search/utils/search-client";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function SearchOverlay({ initialQuery = "", onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    isLoadingMore,
    isDebouncing,
    isTooShort,
    hasQuery,
    loadMoreProducts,
  } = useSearchResults(initialQuery);

  const applySearch = useCallback(
    (term: string) => {
      const normalized = term.trim();
      if (!normalized) return;
      setQuery(normalized);
      setHistory(addSearchHistory(normalized));
    },
    [setQuery],
  );

  const saveCurrentQuery = useCallback(() => {
    if (debouncedQuery.trim()) {
      setHistory(addSearchHistory(debouncedQuery));
    }
  }, [debouncedQuery]);

  const navItems = useMemo(
    () =>
      buildSearchNavItems({
        results,
        history,
        hasQuery,
        onSelectTerm: applySearch,
        onSelectQuery: saveCurrentQuery,
      }),
    [results, history, hasQuery, applySearch, saveCurrentQuery],
  );

  const { activeIndex, setActiveIndex, handleKeyDown } = useSearchKeyboard(navItems, debouncedQuery);

  useEffect(() => {
    let frame = 0;

    const initialize = () => {
      setMounted(true);
      setHistory(getSearchHistory());
      captureHomepageScroll();
      frame = window.requestAnimationFrame(() => setVisible(true));
      inputRef.current?.focus();
    };

    initialize();

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(() => {
      onClose();
      if (window.location.pathname.startsWith("/search")) {
        closeSearchAndReturnHome((href) => router.push(href));
        return;
      }
      restoreHomepageScroll();
    }, SEARCH_TRANSITION_MS);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    applySearch(query);
  }

  function handleClearHistory() {
    clearSearchHistory();
    setHistory([]);
  }

  function handleRemoveHistory(term: string) {
    setHistory(removeSearchHistoryItem(term));
  }

  if (!mounted) return null;

  const showIdleEmpty =
    !hasQuery &&
    !isLoading &&
    results &&
    results.trending.length === 0 &&
    results.popular.length === 0 &&
    results.categories.length === 0 &&
    results.stores.length === 0 &&
    results.brands.length === 0 &&
    history.length === 0;

  const showNoResults =
    hasQuery && !isDebouncing && !isLoading && results && !hasSearchResults(results);

  // Idle nav offsets mirror keyboard-items + render order (Search System v1.0).
  const idleRecentCount = history.length;
  const idleTrendingCount = results?.trending.length ?? 0;
  const idlePopularCount = results?.popular.length ?? 0;
  const idleCategoryCount = results?.categories.length ?? 0;
  const idleStoreCount = results?.stores.length ?? 0;
  const idleRecentOffset = 0;
  const idleTrendingOffset = idleRecentCount;
  const idlePopularOffset = idleRecentCount + idleTrendingCount;
  const idleCategoryOffset = idlePopularOffset + idlePopularCount;
  const idleStoreOffset = idleCategoryOffset + idleCategoryCount;
  const idleBrandOffset = idleStoreOffset + idleStoreCount;

  const productOffset = 0;
  const memberOffset = results ? results.products.slice(0, 5).length : 0;
  const storeQueryOffset = memberOffset + (results?.users.length ?? 0);

  return createPortal(
    <ModalContainer
      open={mounted}
      onClose={handleClose}
      variant="fullscreen"
      zIndex={100}
      ariaLabel="Search"
      className={cn(
        transitionFast,
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
        <div
          ref={panelRef}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden will-change-transform",
            transitionFast,
            visible ? "translate-y-0" : "translate-y-2",
          )}
        >
        <header className="border-b border-border px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <form onSubmit={handleSubmit} role="search" className="flex items-center gap-ds-2">
            <div
              className={cn(
                "relative flex min-h-ds-7 flex-1 items-center rounded-ds-full border border-border bg-white pl-ds-7 pr-ds-2",
                transitionFast,
                "focus-within:ring-2 focus-within:ring-primary/25",
              )}
            >
              <SearchIcon className="pointer-events-none absolute left-ds-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={SEARCH_SYSTEM_V1.placeholder}
                autoComplete="off"
                aria-controls="search-overlay-results"
                aria-activedescendant={
                  activeIndex >= 0 ? `search-nav-item-${activeIndex}` : undefined
                }
                className="min-h-ds-7 w-full border-0 bg-transparent py-ds-2 pr-ds-2 text-sm text-text-primary outline-none placeholder:text-text-muted sm:text-base"
              />
              {(isDebouncing || isLoading) && (
                <LoadingSpinner className="mr-ds-1 h-5 w-5 text-text-muted" aria-hidden />
              )}
              <SearchInputActions />
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-full text-text-secondary hover:bg-secondary hover:text-text-primary",
                focusRing,
                transitionFast,
              )}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </form>
        </header>

        <div
          id="search-overlay-results"
          className={cn(RX_MODAL_BODY, "min-h-[12rem] px-ds-4")}
        >
          {(isDebouncing || isLoading) && hasQuery && <LoadingSkeleton />}

          {!hasQuery && isLoading && !results ? <LoadingSkeleton count={4} /> : null}

          {isTooShort && !isDebouncing && (
            <p className="px-ds-4 py-ds-3 text-sm text-text-secondary" role="status">
              Type at least 2 characters to search.
            </p>
          )}

          {!hasQuery && !isTooShort && results && (
            <>
              {history.length > 0 && (
                <SearchSection title="Recent Searches">
                  <RecentSearches
                    items={history}
                    activeIndex={activeIndex}
                    navOffset={idleRecentOffset}
                    onSelect={applySearch}
                    onRemove={handleRemoveHistory}
                    onClear={handleClearHistory}
                  />
                </SearchSection>
              )}

              {results.trending.length > 0 && (
                <SearchSection title="Trending Searches">
                  <TrendingSearches
                    items={results.trending}
                    activeIndex={activeIndex}
                    navOffset={idleTrendingOffset}
                    onSelect={applySearch}
                  />
                </SearchSection>
              )}

              {results.popular.length > 0 && (
                <SearchSection title="Popular Searches">
                  <TrendingSearches
                    items={results.popular}
                    activeIndex={activeIndex}
                    navOffset={idlePopularOffset}
                    onSelect={applySearch}
                  />
                </SearchSection>
              )}

              {results.categories.length > 0 && (
                <SearchSection title="Suggested Categories">
                  <div className="px-ds-4 py-ds-2">
                    <CategoryResults
                      items={results.categories}
                      activeIndex={activeIndex}
                      navOffset={idleCategoryOffset}
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {results.stores.length > 0 && (
                <SearchSection title="Suggested Stores">
                  <div className="px-ds-4 py-ds-2">
                    <StoreResults
                      items={results.stores}
                      activeIndex={activeIndex}
                      navOffset={idleStoreOffset}
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {results.brands.length > 0 && (
                <SearchSection title="Suggested Brands">
                  <div className="px-ds-4 py-ds-2">
                    <CategoryResults
                      items={results.brands.map((brand) => ({
                        name: brand.name,
                        href: brand.href,
                      }))}
                      activeIndex={activeIndex}
                      navOffset={idleBrandOffset}
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {showIdleEmpty && <SearchResultsEmpty variant="idle" />}
            </>
          )}

          {hasQuery && !isDebouncing && !isLoading && results && (
            <>
              <SearchSection title="Items">
                <SearchSuggestionList
                  results={results}
                  query={debouncedQuery}
                  activeIndex={activeIndex}
                  navOffset={productOffset}
                  onHoverIndex={setActiveIndex}
                  onNavigate={saveCurrentQuery}
                  maxProducts={5}
                  kinds={["product"]}
                />
              </SearchSection>

              {(results.users.length > 0 || results.sellers.length > 0) && (
                <SearchSection title="Members">
                  <div className="px-ds-4 py-ds-2">
                    <SellerResults
                      sellers={[]}
                      users={results.users}
                      activeIndex={activeIndex}
                      navOffset={memberOffset}
                      onHoverIndex={setActiveIndex}
                      onNavigate={saveCurrentQuery}
                    />
                  </div>
                </SearchSection>
              )}

              {results.stores.length > 0 && (
                <SearchSection title="Stores">
                  <div className="px-ds-4 py-ds-2">
                    <StoreResults
                      items={results.stores}
                      activeIndex={activeIndex}
                      navOffset={storeQueryOffset}
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {results.categories.length > 0 && (
                <SearchSection title="Categories">
                  <div className="px-ds-4 py-ds-2">
                    <CategoryResults
                      items={results.categories}
                      activeIndex={activeIndex}
                      navOffset={storeQueryOffset + results.stores.length}
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {results.brands.length > 0 && (
                <SearchSection title="Brands">
                  <div className="px-ds-4 py-ds-2">
                    <CategoryResults
                      items={results.brands.map((brand) => ({
                        name: brand.name,
                        href: brand.href,
                      }))}
                      activeIndex={activeIndex}
                      navOffset={
                        storeQueryOffset + results.stores.length + results.categories.length
                      }
                      onHoverIndex={setActiveIndex}
                    />
                  </div>
                </SearchSection>
              )}

              {results.products.length > 5 && (
                <SearchSection title="More items">
                  <ProductResults
                    items={results.products.slice(5)}
                    query={debouncedQuery}
                    activeIndex={activeIndex}
                    navOffset={
                      productOffset +
                      5 +
                      results.users.length +
                      results.stores.length +
                      results.categories.length +
                      results.brands.length +
                      results.locations.length
                    }
                    hasMore={results.productsHasMore}
                    isLoadingMore={isLoadingMore}
                    onHoverIndex={setActiveIndex}
                    onNavigate={saveCurrentQuery}
                    onLoadMore={() => void loadMoreProducts()}
                  />
                </SearchSection>
              )}

              {results.products.length <= 5 &&
              results.productsHasMore &&
              results.products.length > 0 ? (
                <div className="px-ds-4 py-ds-2">
                  <button
                    type="button"
                    onClick={() => void loadMoreProducts()}
                    disabled={isLoadingMore}
                    className="text-sm font-semibold text-primary"
                  >
                    {isLoadingMore ? "Loading…" : "Load more items"}
                  </button>
                </div>
              ) : null}

              {hasSearchResults(results) ? (
                <div className="border-t border-border px-ds-4 py-ds-3">
                  <a
                    href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                    className="text-sm font-semibold text-primary"
                    onClick={saveCurrentQuery}
                  >
                    View all results
                  </a>
                </div>
              ) : null}

              {showNoResults && (
                <SearchResultsEmpty variant="no-results" query={debouncedQuery} entity="products" />
              )}
            </>
          )}
        </div>
      </div>
    </ModalContainer>,
    document.body,
  );
}
