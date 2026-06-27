"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import {
  defaultCategories,
  defaultRecentSearches,
  defaultSuggestedSellers,
  defaultTrendingSearches,
  filterSuggestions,
  filterSellers,
  searchScopes,
  type SearchScope,
  type SuggestedSeller,
} from "@/lib/search/defaults";
import { useSearchOverlayOptional } from "@/features/search/client";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { focusRing, shadowSoft, transitionFast } from "@/components/ui/tokens";

export type SearchBarProps = {
  inputId?: string;
  name?: string;
  placeholder?: string;
  action?: string;
  buttonLabel?: string;
  defaultValue?: string;
  className?: string;
  overlay?: boolean;
  hideSubmitButton?: boolean;
  variant?: "default" | "header";
  size?: "compact" | "comfortable" | "responsive";
  debounceMs?: number;
  recentSearches?: string[];
  trendingSearches?: string[];
  categories?: { name: string; href: string }[];
  suggestedSellers?: SuggestedSeller[];
  onSearch?: (query: string, scope: SearchScope) => void;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
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

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-ds-4 py-ds-3">
      <h3 className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SearchBar({
  inputId,
  name = "q",
  placeholder = "Items or Members.....",
  action = "/search",
  buttonLabel = "Search",
  defaultValue = "",
  className,
  debounceMs = 300,
  recentSearches = defaultRecentSearches,
  trendingSearches = defaultTrendingSearches,
  categories = defaultCategories,
  suggestedSellers = defaultSuggestedSellers,
  onSearch,
  overlay = false,
  hideSubmitButton = false,
  variant = "default",
  size = "comfortable",
}: SearchBarProps) {
  const generatedId = useId();
  const resolvedInputId = inputId ?? generatedId;
  const listboxId = `${resolvedInputId}-listbox`;
  const searchOverlay = useSearchOverlayOptional();
  const useOverlay = overlay && Boolean(searchOverlay);
  const isHeaderVariant = variant === "header";
  const isCompact = isHeaderVariant && (size === "compact" || size === "responsive");
  const isResponsive = isHeaderVariant && size === "responsive";
  const resolvedPlaceholder = placeholder ?? (isHeaderVariant ? "Search products..." : "Items or Members.....");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(defaultValue);
  const [scope, setScope] = useState<SearchScope>("products");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const isDebouncing = query.trim().length > 0 && debouncedQuery !== query;
  const isOpen = isFocused;

  const filteredRecent = useMemo(
    () => filterSuggestions(recentSearches, debouncedQuery),
    [recentSearches, debouncedQuery],
  );
  const filteredTrending = useMemo(
    () => filterSuggestions(trendingSearches, debouncedQuery),
    [trendingSearches, debouncedQuery],
  );
  const filteredSellers = useMemo(
    () => filterSellers(suggestedSellers, debouncedQuery),
    [suggestedSellers, debouncedQuery],
  );

  const selectableItems = useMemo(() => {
    const items: { label: string; href: string }[] = [];

    filteredRecent.forEach((term) => items.push({ label: term, href: `${action}?q=${encodeURIComponent(term)}&type=${scope}` }));
    filteredTrending.forEach((term) => items.push({ label: term, href: `${action}?q=${encodeURIComponent(term)}&type=${scope}` }));
    categories.forEach((category) => items.push({ label: category.name, href: category.href }));
    filteredSellers.forEach((seller) => items.push({ label: seller.name, href: seller.href }));

    return items;
  }, [filteredRecent, filteredTrending, categories, filteredSellers, action, scope]);

  const closePanel = useCallback(() => {
    setIsFocused(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closePanel]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    onSearch?.(debouncedQuery.trim(), scope);
    if (useOverlay && searchOverlay && !hideSubmitButton) {
      searchOverlay.open(debouncedQuery.trim());
    }
  }, [debouncedQuery, scope, onSearch, useOverlay, searchOverlay, hideSubmitButton]);

  function openSearchOverlay() {
    if (!useOverlay || !searchOverlay) return;
    searchOverlay.open(query);
    inputRef.current?.blur();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (useOverlay) {
      event.preventDefault();
      openSearchOverlay();
      return;
    }

    if (activeIndex >= 0 && selectableItems[activeIndex]) {
      event.preventDefault();
      window.location.href = selectableItems[activeIndex].href;
      return;
    }

    onSearch?.(query.trim(), scope);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closePanel();
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || selectableItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % selectableItems.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? selectableItems.length - 1 : index - 1));
    }
  }

  function applySearchTerm(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form action={action} method="GET" role="search" onSubmit={handleSubmit}>
        <input type="hidden" name="type" value={scope} />

        <label htmlFor={resolvedInputId} className="sr-only">
          {isHeaderVariant ? "Search products" : "Search products, users, or stores"}
        </label>

        <div
          className={cn(
            "group/search relative flex w-full items-center rounded-ds-full border",
            transitionFast,
            isHeaderVariant
              ? cn(
                  "rx-glass border-border/60",
                  "transition-[border-color,box-shadow,background-color,transform] duration-ds-normal ease-ds",
                  "hover:border-primary/25 hover:shadow-[var(--ds-depth-2)]",
                  "focus-within:border-primary/45 focus-within:shadow-[var(--ds-glow-primary)] focus-within:ring-2 focus-within:ring-ring/15",
                  isOpen && "border-primary/45 shadow-[var(--ds-glow-primary)] ring-2 ring-ring/15",
                  isResponsive
                    ? "min-h-9 pl-2.5 pr-1.5 lg:min-h-11 lg:pl-3 lg:pr-2"
                    : isCompact
                      ? "min-h-9 pl-2.5 pr-1.5"
                      : "min-h-11 pl-3 pr-2",
                  "active:scale-[0.995]",
                )
              : cn(
                  "border-white/10 bg-black/90 pl-3 pr-2 backdrop-blur-xl",
                  shadowSoft,
                  isOpen && "border-primary/40 shadow-ds-medium ring-2 ring-ring/20",
                  !isOpen &&
                    "focus-within:border-primary/40 focus-within:shadow-ds-medium focus-within:ring-2 focus-within:ring-ring/20",
                ),
          )}
          data-voice-search-ready={isHeaderVariant ? "true" : undefined}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center transition-colors duration-ds-normal",
              isHeaderVariant
                ? cn(
                    "text-text-muted group-focus-within/search:text-primary/80",
                    isResponsive
                      ? "left-2.5 lg:left-3"
                      : isCompact
                        ? "left-2.5"
                        : "left-3",
                  )
                : "left-3 text-white/70",
            )}
          >
            <SearchIcon
              className={cn(
                isResponsive ? "h-4 w-4 lg:h-5 lg:w-5" : isCompact ? "h-4 w-4" : "h-5 w-5",
              )}
            />
          </span>

          <input
            ref={inputRef}
            id={resolvedInputId}
            type="search"
            name={name}
            value={query}
            placeholder={resolvedPlaceholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (useOverlay) {
                openSearchOverlay();
                return;
              }
              setIsFocused(true);
            }}
            onKeyDown={handleKeyDown}
            readOnly={useOverlay}
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent py-0 text-text-primary outline-none placeholder:text-text-muted",
              isHeaderVariant
                ? cn(
                    isResponsive
                      ? "h-9 pl-8 pr-1 text-xs sm:text-sm lg:h-11 lg:pl-10 lg:pr-ds-2 lg:text-base"
                      : isCompact
                        ? "h-9 pl-8 pr-1 text-xs sm:text-sm"
                        : "h-11 pl-10 pr-ds-2 text-sm sm:text-base",
                  )
                : "h-[3.25rem] pl-10 pr-ds-2 text-sm lg:h-[3.75rem] sm:text-base",
              useOverlay && "cursor-pointer",
            )}
          />

          <div className="mr-1 flex shrink-0 items-center gap-1.5">
            {isDebouncing && (
              <span
                className="flex min-h-ds-7 min-w-ds-7 items-center justify-center text-text-muted"
                aria-hidden
              >
                <LoadingSpinner className="h-5 w-5" />
              </span>
            )}

            {query.length > 0 && !isDebouncing && !useOverlay && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "flex min-h-ds-7 min-w-ds-7 items-center justify-center rounded-ds-full text-text-secondary hover:bg-secondary hover:text-text-primary",
                  focusRing,
                  transitionFast,
                )}
              >
                <ClearIcon className="h-5 w-5" />
              </button>
            )}

            {!hideSubmitButton && (
              <button
                type="submit"
                className={cn(
                  "inline-flex h-10 min-w-ds-7 items-center justify-center rounded-ds-full bg-primary px-ds-4 text-sm font-semibold text-primary-foreground hover:opacity-90 lg:h-11 lg:px-ds-5",
                  focusRing,
                  transitionFast,
                )}
              >
                {buttonLabel}
              </button>
            )}

            {isHeaderVariant && hideSubmitButton && !isCompact && (
              <button
                type="submit"
                aria-label="Search"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-ds-full text-text-muted hover:bg-secondary hover:text-text-primary active:scale-95",
                  focusRing,
                  transitionFast,
                )}
              >
                <SearchIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {isOpen && !useOverlay && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+var(--ds-space-2))] z-50 overflow-hidden rounded-ds-xl border border-border bg-overlay shadow-ds-floating backdrop-blur-xl backdrop-saturate-150",
            transitionFast,
          )}
        >
          <div className="flex gap-ds-1 border-b border-border px-ds-3 py-ds-2">
            {searchScopes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={scope === item.id}
                onClick={() => setScope(item.id)}
                className={cn(
                  "min-h-ds-7 rounded-ds-full px-ds-4 text-sm font-medium",
                  focusRing,
                  transitionFast,
                  scope === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-secondary hover:text-text-primary",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isDebouncing ? (
            <div className="flex min-h-ds-7 items-center justify-center px-ds-4 py-ds-6 text-sm text-text-secondary">
              Searching…
            </div>
          ) : (
            <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
              {filteredRecent.length > 0 && (
                <PanelSection title="Recent searches">
                  <ul className="flex flex-col gap-ds-1">
                    {filteredRecent.map((term, index) => {
                      const itemIndex = index;
                      return (
                        <li key={term}>
                          <button
                            type="button"
                            role="option"
                            id={`${listboxId}-option-${itemIndex}`}
                            aria-selected={activeIndex === itemIndex}
                            onClick={() => applySearchTerm(term)}
                            className={cn(
                              "flex min-h-ds-7 w-full items-center rounded-ds-md px-ds-3 text-left text-sm text-text-primary hover:bg-secondary",
                              focusRing,
                              transitionFast,
                              activeIndex === itemIndex && "bg-secondary",
                            )}
                          >
                            {term}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </PanelSection>
              )}

              {filteredTrending.length > 0 && (
                <PanelSection title="Trending searches">
                  <ul className="flex flex-wrap gap-ds-2">
                    {filteredTrending.map((term, index) => {
                      const itemIndex = filteredRecent.length + index;
                      return (
                        <li key={term}>
                          <button
                            type="button"
                            role="option"
                            id={`${listboxId}-option-${itemIndex}`}
                            aria-selected={activeIndex === itemIndex}
                            onClick={() => applySearchTerm(term)}
                            className={cn(
                              "inline-flex min-h-ds-7 items-center rounded-ds-full bg-secondary px-ds-4 text-sm font-medium text-text-primary hover:bg-primary/10 hover:text-primary",
                              focusRing,
                              transitionFast,
                              activeIndex === itemIndex && "bg-primary/10 text-primary",
                            )}
                          >
                            {term}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </PanelSection>
              )}

              {categories.length > 0 && (
                <PanelSection title="Categories">
                  <ul className="flex flex-wrap gap-ds-2">
                    {categories.map((category, index) => {
                      const itemIndex = filteredRecent.length + filteredTrending.length + index;
                      return (
                        <li key={category.href}>
                          <CategoryChip
                            label={category.name}
                            href={category.href}
                            className={cn(activeIndex === itemIndex && "bg-primary/10 text-primary")}
                            onMouseEnter={() => setActiveIndex(itemIndex)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </PanelSection>
              )}

              {filteredSellers.length > 0 && (
                <PanelSection title="Suggested sellers">
                  <ul className="flex flex-col gap-ds-1">
                    {filteredSellers.map((seller, index) => {
                      const itemIndex =
                        filteredRecent.length + filteredTrending.length + categories.length + index;
                      return (
                        <li key={seller.href}>
                          <Link
                            href={seller.href}
                            role="option"
                            id={`${listboxId}-option-${itemIndex}`}
                            aria-selected={activeIndex === itemIndex}
                            onMouseEnter={() => setActiveIndex(itemIndex)}
                            className={cn(
                              "flex min-h-ds-7 items-center gap-ds-3 rounded-ds-md px-ds-3 text-sm text-text-primary hover:bg-secondary",
                              focusRing,
                              transitionFast,
                              activeIndex === itemIndex && "bg-secondary",
                            )}
                          >
                            <Avatar name={seller.name} alt={seller.name} src={seller.avatar} size="sm" />
                            <span className="font-medium">{seller.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </PanelSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
