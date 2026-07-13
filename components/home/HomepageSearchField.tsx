"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ImageSearchCamera } from "@/components/home/ImageSearchCamera";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useClientHydrated } from "@/lib/react/use-client-hydrated";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import {
  defaultRecentSearches,
  defaultTrendingSearches,
  filterSuggestions,
} from "@/lib/search/defaults";
import { fetchSearchResults } from "@/features/search/utils/fetch-search";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from "@/features/search/types";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { storeImageSearchQuery } from "@/lib/image-search/storage";
import { captureHomepageScroll } from "@/lib/navigation/homepage-scroll-restore";

export type HomepageSearchFieldProps = {
  /** Stable id required — must match between server and client markup. */
  inputId: string;
  className?: string;
};

type SuggestionItem = {
  label: string;
  href: string;
};

export function HomepageSearchField({ inputId, className }: HomepageSearchFieldProps) {
  const router = useRouter();
  const hydrated = useClientHydrated();
  const listboxId = `${inputId}-suggestions`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [remoteSuggestions, setRemoteSuggestions] = useState<SuggestionItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const imageSearchInputId = `${inputId}-image-search`;

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const trimmedQuery = query.trim();
  const trimmedDebounced = debouncedQuery.trim();
  const isDebouncing = hydrated && trimmedQuery.length > 0 && debouncedQuery !== query;
  const shouldFetchRemote = hydrated && trimmedDebounced.length >= SEARCH_MIN_CHARS;

  const localSuggestions: SuggestionItem[] = hydrated
    ? (() => {
        const terms = [
          ...filterSuggestions(defaultRecentSearches, trimmedDebounced),
          ...filterSuggestions(defaultTrendingSearches, trimmedDebounced),
        ];
        const unique = [...new Set(terms)];
        return unique.map((term) => ({
          label: term,
          href: `/search?q=${encodeURIComponent(term)}`,
        }));
      })()
    : [];

  const suggestions = shouldFetchRemote ? remoteSuggestions : localSuggestions;

  const isOpen = hydrated && isFocused && suggestions.length > 0;

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
    if (!shouldFetchRemote) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const pendingQuery = trimmedDebounced;
    const loadingTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) setIsFetching(true);
    }, 0);

    fetchSearchResults({ query: pendingQuery, productLimit: 5, signal: controller.signal })
      .then((results) => {
        const items: SuggestionItem[] = [];

        for (const product of results.products.slice(0, 5)) {
          items.push({
            label: product.title,
            href: `/listing/${product.slug}`,
          });
        }

        for (const category of results.categories.slice(0, 3)) {
          items.push({ label: category.name, href: category.href });
        }

        setRemoteSuggestions(items);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setRemoteSuggestions([]);
        }
      })
      .finally(() => {
        window.clearTimeout(loadingTimer);
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [shouldFetchRemote, trimmedDebounced]);

  function navigateToSearch(term: string) {
    const normalized = term.trim();
    if (!normalized) return;
    closePanel();
    inputRef.current?.blur();
    captureHomepageScroll();
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      closePanel();
      router.push(suggestions[activeIndex].href);
      return;
    }

    navigateToSearch(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closePanel();
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
  }

  async function handleImageSearchFiles(files: FileList) {
    const file = files[0];
    if (!file) return;

    setIsImageProcessing(true);
    try {
      const { fileToDataUrl } = await import("@/lib/image-search/similarity");
      const dataUrl = await fileToDataUrl(file);
      storeImageSearchQuery(dataUrl);
      captureHomepageScroll();
      router.push("/search?visual=1");
    } catch {
      // User cancelled or image could not be read — stay on homepage.
    } finally {
      setIsImageProcessing(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("homepage-search", className)}>
      <form action="/search" method="GET" role="search" onSubmit={handleSubmit} className="homepage-search__form">
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>

        <div
          className={cn(
            "homepage-search__control",
            isOpen && "homepage-search__control--open",
            transitionFast,
          )}
        >
          <span className="homepage-search__icon" aria-hidden>
            <RovexoIcon icon={RovexoIcons.navigation.search} size={20} />
          </span>

          <input
            ref={inputRef}
            id={inputId}
            type="search"
            name="q"
            value={query}
            placeholder="Search for items or members"
            autoComplete="off"
            enterKeyHint="search"
            role={hydrated ? "combobox" : "searchbox"}
            aria-expanded={hydrated ? isOpen : false}
            aria-controls={hydrated ? listboxId : undefined}
            aria-autocomplete={hydrated ? "list" : undefined}
            aria-activedescendant={
              hydrated && isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            data-header-search="field"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            className="homepage-search__input"
          />

          <div className="homepage-search__actions">
            {isDebouncing || (shouldFetchRemote && isFetching) ? (
              <span className="homepage-search__spinner" aria-hidden>
                <svg className="homepage-search__spinner-icon" viewBox="0 0 24 24">
                  <circle
                    className="homepage-search__spinner-track"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="homepage-search__spinner-head"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                  />
                </svg>
              </span>
            ) : null}

            {hydrated && query.length > 0 && !isDebouncing && !isFetching ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className={cn("homepage-search__clear", focusRing, transitionFast)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.42L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                  />
                </svg>
              </button>
            ) : (
              <ImageSearchCamera
                inputId={imageSearchInputId}
                processing={isImageProcessing}
                onFilesSelected={(files) => void handleImageSearchFiles(files)}
              />
            )}
          </div>
        </div>

        {isOpen ? (
          <ul id={listboxId} role="listbox" className="homepage-search__suggestions">
            {suggestions.map((item, index) => (
              <li key={`${item.href}-${item.label}`} role="presentation">
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "homepage-search__suggestion",
                    activeIndex === index && "homepage-search__suggestion--active",
                    focusRing,
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    closePanel();
                    captureHomepageScroll();
                    router.push(item.href);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </div>
  );
}
