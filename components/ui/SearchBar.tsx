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
  showAiCamera?: boolean;
  unreadNotifications?: number;
  debounceMs?: number;
  recentSearches?: string[];
  trendingSearches?: string[];
  categories?: { name: string; href: string }[];
  suggestedSellers?: SuggestedSeller[];
  onSearch?: (query: string, scope: SearchScope) => void;
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.813 4.5h6.374a2.31 2.31 0 0 1 2.006 1.175l1.015 1.8A2.31 2.31 0 0 0 20.25 8.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V8.25c0-.994.627-1.881 1.566-2.212l1.511-.863Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
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
  showAiCamera = false,
  unreadNotifications = 0,
}: SearchBarProps) {
  const generatedId = useId();
  const resolvedInputId = inputId ?? generatedId;
  const listboxId = `${resolvedInputId}-listbox`;
  const searchOverlay = useSearchOverlayOptional();
  const useOverlay = overlay && Boolean(searchOverlay);

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
          Search products, users, or stores
        </label>

        <div
  className={cn(
    "relative flex w-full items-center rounded-full border border-white/10 bg-black/90 pl-3 pr-2 backdrop-blur-xl",
    shadowSoft,
    transitionFast,
    isOpen && "border-primary/40 shadow-ds-medium ring-2 ring-ring/20",
    !isOpen &&
      "focus-within:border-primary/40 focus-within:shadow-ds-medium focus-within:ring-2 focus-within:ring-ring/20",
  )}
>
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 pointer-events-none">
  <img
    src="/logo-3d.png"
    alt="ROVEXO"
    className="h-8 w-8 object-contain"
  />

  <span className="text-[16px] font-bold text-white whitespace-nowrap">
    Rovexo
  </span>
</div>

          <input
            ref={inputRef}
            id={resolvedInputId}
            type="search"
            name={name}
            value={query}
            placeholder={placeholder}
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
              "h-[3.25rem] min-w-0 flex-1 border-0 bg-transparent py-0  pl-[120px] pr-ds-2 text-sm text-text-primary outline-none placeholder:text-text-muted sm:text-base lg:h-[3.75rem]",
              useOverlay && "cursor-pointer",
            )}
          />

<div className="mr-2 flex shrink-0 items-center gap-2">
<button
  type="submit"
  aria-label="Search"
  className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-white/10 hover:text-white transition-colors"
>
  <SearchIcon className="h-5 w-5" />
</button>
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

            {showAiCamera && (
              <Link
                href="/sell"
                aria-label="AI Camera"
                className={cn(
                  "flex min-h-ds-7 min-w-ds-7 items-center justify-center rounded-ds-full text-text-secondary hover:bg-secondary hover:text-text-primary",
                  focusRing,
                  transitionFast,
                )}
              >
                <CameraIcon className="h-5 w-5" />
              </Link>
            )}

            {!hideSubmitButton && (
              <button
                type="submit"
                className={cn(
                  "inline-flex h-10 min-w-ds-7 items-center justify-center rounded-ds-full bg-primary px-ds-4 text-sm font-semibold text-primary-foreground shadow-ds-soft hover:opacity-90 lg:h-11 lg:px-ds-5",
                  focusRing,
                  transitionFast,
                )}
              >
                {buttonLabel}
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
