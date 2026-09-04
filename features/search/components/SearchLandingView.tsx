"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
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
  /**
   * Navigation SSOT separation:
   * - browse → Bottom Nav Browse (Browse Categories)
   * - search → Header Global Search (Recent / Trending / typeahead — no category grid)
   */
  surface?: "browse" | "search";
};

const EMPTY_CATEGORY_COUNTS: SearchLandingCategoryCount[] = [];
const EMPTY_TRENDING: string[] = [];

function ClockIcon() {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.recent} size={14} />;
}

function TrendIcon() {
  return <PlatformEmoji emoji="📈" size={14} />;
}

function ChipCloseIcon() {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.close} size={12} />;
}

/**
 * Browse Categories grid — isolated from recent-history hydrate / chip updates.
 * Presentation identical to SEARCH_UI_v1.0 (no visual change).
 */
const BrowseCategoriesGrid = memo(function BrowseCategoriesGrid({
  categoryCounts,
}: {
  categoryCounts: SearchLandingCategoryCount[];
}) {
  const countBySlug = useMemo(
    () => new Map(categoryCounts.map((row) => [row.slug, row.itemCount])),
    [categoryCounts],
  );

  return (
    <section className="srch-land__section" aria-labelledby="srch-land-categories-title">
      <div className="srch-land__section-head">
        <h2 id="srch-land-categories-title" className="srch-land__section-title">
          Browse categories
        </h2>
      </div>
      <div className="srch-land__grid">
        {ROVEXO_HOME_CATEGORY_RAIL.map((item, index) => (
          <SearchCategoryBrowseCard
            key={item.slug}
            name={item.name}
            slug={item.slug}
            iconKey={item.icon}
            itemCount={countBySlug.get(item.slug) ?? 0}
            href={item.href ?? `/category/${encodeURIComponent(item.slug)}`}
            /* First two mobile rows (3-col) are above-fold LCP candidates. */
            priority={index < 6}
          />
        ))}
      </div>
    </section>
  );
});

const TrendingSearchesSection = memo(function TrendingSearchesSection({
  trending,
  onApplyTerm,
}: {
  trending: string[];
  onApplyTerm: (term: string) => void;
}) {
  if (trending.length === 0) return null;

  return (
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
              onClick={() => onApplyTerm(term)}
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
  );
});

/**
 * SEARCH_UI_v1.0 — browse / global-search idle surfaces (presentation reused).
 * Typeahead runs inline (no Homepage overlay bypass).
 */
export function SearchLandingView({
  categoryCounts = EMPTY_CATEGORY_COUNTS,
  trending = EMPTY_TRENDING,
  surface = "browse",
}: SearchLandingViewProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const isGlobalSearch = surface === "search";

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

  useEffect(() => {
    if (!isGlobalSearch) return;
    inputRef.current?.focus();
  }, [isGlobalSearch]);

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

  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const handleRemoveHistory = useCallback((term: string) => {
    setHistory(removeSearchHistoryItem(term).slice(0, SUPREME_BLOOD_CODE_XXVII_V1.recentMax));
  }, []);

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
      data-ui-polish-phase1="search-v1"
      data-search-surface={surface}
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
          {!isGlobalSearch ? <BrowseCategoriesGrid categoryCounts={categoryCounts} /> : null}

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

          <TrendingSearchesSection trending={trending} onApplyTerm={applyTerm} />
        </>
      )}
    </div>
  );
}
