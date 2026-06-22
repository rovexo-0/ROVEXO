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
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { CategoryResults } from "@/features/search/components/CategoryResults";
import { EmptyState } from "@/features/search/components/EmptyState";
import { LoadingSkeleton } from "@/features/search/components/LoadingSkeleton";
import { ProductResults } from "@/features/search/components/ProductResults";
import { RecentSearches } from "@/features/search/components/RecentSearches";
import { SavedSearchesPanel } from "@/features/search/components/SavedSearchesPanel";
import { SearchSection } from "@/features/search/components/SearchSection";
import { SellerActions } from "@/features/search/components/SellerActions";
import { SellerResults } from "@/features/search/components/SellerResults";
import { StoreResults } from "@/features/search/components/StoreResults";
import { TrendingSearches } from "@/features/search/components/TrendingSearches";
import { useSearchKeyboard } from "@/features/search/hooks/use-search-keyboard";
import { useSearchResults } from "@/features/search/hooks/use-search-results";
import type { SearchOverlayProps } from "@/features/search/types";
import { SEARCH_TRANSITION_MS } from "@/features/search/types";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
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

export function SearchOverlay({ initialQuery = "", isSeller = false, onClose }: SearchOverlayProps) {
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
      frame = window.requestAnimationFrame(() => setVisible(true));
      inputRef.current?.focus();
    };

    initialize();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, SEARCH_TRANSITION_MS);
  }

  useEffect(() => {
    function handleKeyDownGlobal(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setVisible(false);
        window.setTimeout(onClose, SEARCH_TRANSITION_MS);
      }
    }

    document.addEventListener("keydown", handleKeyDownGlobal);
    return () => document.removeEventListener("keydown", handleKeyDownGlobal);
  }, [onClose]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    applySearch(query);
  }

  function handleClearHistory() {
    clearSearchHistory();
    setHistory([]);
  }

  if (!mounted) return null;

  const showIdleEmpty =
    !hasQuery &&
    !isLoading &&
    results &&
    history.length === 0 &&
    results.trending.length === 0 &&
    results.categories.length === 0;

  const showNoResults =
    hasQuery && !isDebouncing && !isLoading && results && !hasSearchResults(results);

  const recentOffset = 0;
  const trendingOffset = history.length;
  const idleCategoryOffset = history.length + (results?.trending.length ?? 0);

  const productOffset = 0;
  const sellerOffset = results?.products.length ?? 0;
  const storeOffset = sellerOffset + (results?.sellers.length ?? 0) + (results?.users.length ?? 0);
  const queryCategoryOffset = storeOffset + (results?.stores.length ?? 0);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col",
        transitionFast,
        visible ? "opacity-100" : "opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={handleClose}
        className={cn("absolute inset-0 bg-background/70 backdrop-blur-sm", transitionFast)}
      />

      <div
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative mx-auto flex h-full w-full max-w-2xl flex-col bg-background/95 shadow-ds-floating backdrop-blur-xl backdrop-saturate-150",
          transitionFast,
          visible ? "translate-y-0" : "translate-y-2",
        )}
      >
        <header className="border-b border-border px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <form onSubmit={handleSubmit} role="search" className="flex items-center gap-ds-2">
            <div
              className={cn(
                "relative flex min-h-ds-7 flex-1 items-center rounded-ds-full border border-border bg-overlay pl-ds-7 pr-ds-2 shadow-ds-soft backdrop-blur-xl",
                transitionFast,
                "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/20",
              )}
            >
              <SearchIcon className="pointer-events-none absolute left-ds-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, brands or sellers..."
                autoComplete="off"
                aria-controls="search-overlay-results"
                aria-activedescendant={
                  activeIndex >= 0 ? `search-nav-item-${activeIndex}` : undefined
                }
                className="min-h-ds-7 w-full border-0 bg-transparent py-ds-2 pr-ds-2 text-sm text-text-primary outline-none placeholder:text-text-muted sm:text-base"
              />
              {(isDebouncing || isLoading) && (
                <LoadingSpinner className="mr-ds-2 h-5 w-5 text-text-muted" aria-hidden />
              )}
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

          {isSeller && <SellerActions />}
        </header>

        <div
          id="search-overlay-results"
          className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),var(--ds-space-4))]"
        >
          {(isDebouncing || isLoading) && hasQuery && <LoadingSkeleton />}

          {!hasQuery && !isLoading && results && (
            <>
              {history.length > 0 && (
                <SearchSection title="🕒 Recent Searches">
                  <RecentSearches
                    items={history}
                    activeIndex={activeIndex}
                    navOffset={recentOffset}
                    onSelect={applySearch}
                    onClear={handleClearHistory}
                  />
                </SearchSection>
              )}

              <SearchSection title="⭐ Saved Searches">
                <SavedSearchesPanel currentQuery="" onSelect={applySearch} />
              </SearchSection>

              {results.trending.length > 0 && (
                <SearchSection title="🔥 Trending Searches">
                  <TrendingSearches
                    items={results.trending}
                    activeIndex={activeIndex}
                    navOffset={trendingOffset}
                    onSelect={applySearch}
                  />
                </SearchSection>
              )}

              {results.categories.length > 0 && (
                <SearchSection title="📂 Categories">
                  <CategoryResults
                    items={results.categories}
                    activeIndex={activeIndex}
                    navOffset={idleCategoryOffset}
                    onHoverIndex={setActiveIndex}
                  />
                </SearchSection>
              )}

              {showIdleEmpty && <EmptyState variant="idle" />}
            </>
          )}

          {hasQuery && !isDebouncing && !isLoading && results && (
            <>
              <SearchSection title="⭐ Saved Searches">
                <SavedSearchesPanel currentQuery={query} onSelect={applySearch} />
              </SearchSection>

              {results.products.length > 0 && (
                <SearchSection title="📦 Products">
                  <ProductResults
                    items={results.products}
                    activeIndex={activeIndex}
                    navOffset={productOffset}
                    hasMore={results.productsHasMore}
                    isLoadingMore={isLoadingMore}
                    onHoverIndex={setActiveIndex}
                    onNavigate={saveCurrentQuery}
                    onLoadMore={() => void loadMoreProducts()}
                  />
                </SearchSection>
              )}

              {(results.sellers.length > 0 || results.users.length > 0) && (
                <SearchSection title="👤 Sellers">
                  <SellerResults
                    sellers={results.sellers}
                    users={results.users}
                    activeIndex={activeIndex}
                    navOffset={sellerOffset}
                    onHoverIndex={setActiveIndex}
                    onNavigate={saveCurrentQuery}
                  />
                </SearchSection>
              )}

              {results.stores.length > 0 && (
                <SearchSection title="🏪 Stores">
                  <StoreResults
                    items={results.stores}
                    activeIndex={activeIndex}
                    navOffset={storeOffset}
                    onHoverIndex={setActiveIndex}
                  />
                </SearchSection>
              )}

              {results.categories.length > 0 && (
                <SearchSection title="📂 Categories">
                  <CategoryResults
                    items={results.categories}
                    activeIndex={activeIndex}
                    navOffset={queryCategoryOffset}
                    onHoverIndex={setActiveIndex}
                  />
                </SearchSection>
              )}

              {showNoResults && <EmptyState variant="no-results" query={debouncedQuery} />}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
