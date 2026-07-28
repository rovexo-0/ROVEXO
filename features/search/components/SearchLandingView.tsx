"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchInputActions } from "@/features/search/components/SearchInputActions";
import { SearchCategoryBrowseCard } from "@/features/search/components/SearchCategoryBrowseCard";
import { SearchTypeaheadPanel } from "@/features/search/components/SearchTypeaheadPanel";
import {
  SearchBarCloseIcon,
  SearchBarSearchIcon,
} from "@/features/search/components/SearchBarIcons";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from "@/features/search/utils/history";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";
import { SEARCH_MIN_CHARS } from "@/features/search/types";
import { isInvalidSearchSentinel } from "@/features/search/utils/sanitize-search-query";
import { SUPREME_BLOOD_CODE_XXVII_V1 } from "@/lib/supreme-blood-code-xxvii-v1";
import { closeSearchAndReturnHome } from "@/lib/navigation/homepage-scroll-restore";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import "@/styles/rovexo/search-landing-v1.css";
import "@/styles/rovexo/category-rail.css";

export type SearchLandingCategoryCount = {
  slug: string;
  itemCount: number;
};

type SearchLandingViewProps = {
  categoryCounts?: SearchLandingCategoryCount[];
  trending?: string[];
};

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M4 16l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChipCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

/**
 * SEARCH_UI_v1.0 — /search idle landing (Owner frozen 2026-07-25).
 * Hierarchy: Search Bar → Category Grid → Recent → Trending.
 * Typeahead runs inline on this page (no separate Homepage overlay).
 */
export function SearchLandingView({
  categoryCounts = [],
  trending = [],
}: SearchLandingViewProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Hydrate from localStorage after paint — setState must not run sync in the effect body.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setHistory(getSearchHistory().slice(0, SUPREME_BLOOD_CODE_XXVII_V1.recentMax));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const countBySlug = new Map(categoryCounts.map((row) => [row.slug, row.itemCount]));
  const isTyping = query.trim().length > 0;

  const handleClose = useCallback(() => {
    if (isTyping) {
      setQuery("");
      inputRef.current?.blur();
      return;
    }
    closeSearchAndReturnHome((href) => router.push(href));
  }, [isTyping, router]);

  const applyTerm = useCallback(
    (term: string) => {
      const normalized = term.trim();
      if (!normalized) return;
      setHistory(addSearchHistory(normalized).slice(0, SUPREME_BLOOD_CODE_XXVII_V1.recentMax));
      router.push(`/search?q=${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  function handleClearHistory() {
    clearSearchHistory();
    setHistory([]);
  }

  function handleRemoveHistory(term: string) {
    setHistory(removeSearchHistoryItem(term).slice(0, SUPREME_BLOOD_CODE_XXVII_V1.recentMax));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim();
    if (normalized.length < SEARCH_MIN_CHARS) return;
    setHistory(addSearchHistory(normalized).slice(0, SUPREME_BLOOD_CODE_XXVII_V1.recentMax));
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  }

  return (
    <div
      className="srch-land"
      data-search-freeze="SEARCH_UI_v1.0"
      data-search-ui="v1.0"
      data-search-version="v1.0"
      data-blood-code-xxvii="27.0"
      data-blood-code-xxviii-polish="1.0"
      data-blood-code-xxix="29.0"
      data-blood-code-xxxi="31.0"
      data-search-landing="v1"
    >
      <div className="srch-land__bar-row">
        <form className="srch-land__bar" role="search" onSubmit={handleSubmit}>
          <span className="srch-land__bar-icon" aria-hidden>
            <SearchBarSearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              const raw = event.target.value;
              if (typeof raw !== "string" || isInvalidSearchSentinel(raw)) {
                setQuery("");
                return;
              }
              setQuery(raw);
            }}
            placeholder={SEARCH_SYSTEM_V1.placeholder}
            className="srch-land__bar-input"
            aria-label={SEARCH_SYSTEM_V1.placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
          <span
            className="srch-land__camera"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <SearchInputActions />
          </span>
        </form>
        <button
          type="button"
          className={cn("srch-land__close", focusRing, transitionFast)}
          aria-label={isTyping ? "Clear search" : "Close search and return to homepage"}
          onClick={handleClose}
        >
          <SearchBarCloseIcon />
        </button>
      </div>

      {isTyping ? (
        <SearchTypeaheadPanel query={query} onQueryChange={setQuery} />
      ) : (
        <>
          <section className="srch-land__section" aria-labelledby="srch-land-categories-title">
            <div className="srch-land__section-head">
              <h2 id="srch-land-categories-title" className="srch-land__section-title">
                Browse categories
              </h2>
              <Link href="/categories" className={cn("srch-land__section-action", focusRing)}>
                View all &gt;
              </Link>
            </div>
            <div className="srch-land__grid">
              {ROVEXO_HOME_CATEGORY_RAIL.map((item) => (
                <SearchCategoryBrowseCard
                  key={item.slug}
                  name={item.name}
                  slug={item.slug}
                  iconKey={item.icon}
                  itemCount={countBySlug.get(item.slug) ?? 0}
                  href={item.href ?? `/search?category=${encodeURIComponent(item.slug)}`}
                />
              ))}
            </div>
          </section>

          {history.length > 0 ? (
            <section className="srch-land__section" aria-labelledby="srch-land-recent-title">
              <div className="srch-land__section-head">
                <h2 id="srch-land-recent-title" className="srch-land__section-title">
                  Recent searches
                </h2>
                <button
                  type="button"
                  className={cn("srch-land__section-action", focusRing)}
                  onClick={handleClearHistory}
                >
                  Clear history
                </button>
              </div>
              <ul className="srch-land__chips" aria-label="Recent searches">
                {history.map((term) => (
                  <li key={term} className="srch-land__chip">
                    <button
                      type="button"
                      className="srch-land__chip-main"
                      onClick={() => applyTerm(term)}
                    >
                      <span className="srch-land__chip-icon">
                        <ClockIcon />
                      </span>
                      <span className="srch-land__chip-label">{term}</span>
                    </button>
                    <button
                      type="button"
                      className="srch-land__chip-x"
                      aria-label={`Remove ${term}`}
                      onClick={() => handleRemoveHistory(term)}
                    >
                      <ChipCloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {trending.length > 0 ? (
            <section className="srch-land__section" aria-labelledby="srch-land-trending-title">
              <div className="srch-land__section-head">
                <h2 id="srch-land-trending-title" className="srch-land__section-title">
                  Trending searches
                </h2>
              </div>
              <ul className="srch-land__chips" aria-label="Trending searches">
                {trending.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      className="srch-land__chip srch-land__chip--trending"
                      onClick={() => applyTerm(term)}
                    >
                      <span className="srch-land__chip-icon">
                        <TrendIcon />
                      </span>
                      <span className="srch-land__chip-label">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
