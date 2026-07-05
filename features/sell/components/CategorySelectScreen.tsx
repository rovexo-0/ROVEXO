"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { categoryTree } from "@/lib/categories/tree";
import { getCategoryIcon, getCategoryImageUrl } from "@/lib/categories/visuals";
import { segmentsFromPath } from "@/lib/categories/navigation";
import { flatPathFromSegments, type CategoryNode, type FlatCategoryPath } from "@/lib/categories/types";
import {
  searchCategoryPicker,
  warmCategoryPickerIndex,
  type CategoryPickerResult,
} from "@/lib/sell/category-picker-search";
import {
  getFrequentCategoryPaths,
  getPopularCategoryPaths,
  getRecentCategoryPaths,
  getRecommendedCategoryPaths,
  getTrendingCategoryPaths,
  recordCategorySelection,
} from "@/lib/categories/category-history";

type CategorySelectScreenProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: FlatCategoryPath) => void;
};

const SEARCH_DEBOUNCE_MS = 40;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
    </svg>
  );
}

/** Premium rounded icon shown for top-level parent categories. */
function CategoryIcon({ slug }: { slug: string }) {
  return (
    <span className="grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-surface-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getCategoryImageUrl(slug)}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="h-12 w-12 rounded-[12px] object-cover"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "grid";
        }}
      />
      <span className="hidden h-12 w-12 place-items-center text-2xl" aria-hidden>
        {getCategoryIcon(slug)}
      </span>
    </span>
  );
}

export function CategorySelectScreen({ open, onClose, onSelect }: CategorySelectScreenProps) {
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  // Warm the search index once the screen becomes available.
  useEffect(() => {
    if (open) warmCategoryPickerIndex();
  }, [open]);

  const handleClose = () => {
    setStack([]);
    setQuery("");
    setDebouncedQuery("");
    onClose();
  };

  const selectPath = (path: FlatCategoryPath) => {
    recordCategorySelection(path);
    onSelect(path);
    handleClose();
  };

  // Debounced, off-keystroke search (<50ms budget).
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  // Lock background scroll while the full-screen picker is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const searchResults = useMemo<CategoryPickerResult[]>(
    () => (debouncedQuery.trim().length >= 2 ? searchCategoryPicker(debouncedQuery) : []),
    [debouncedQuery],
  );

  const recentPaths = useMemo(() => (open ? getRecentCategoryPaths() : []), [open]);
  const frequentPaths = useMemo(() => (open ? getFrequentCategoryPaths() : []), [open]);
  const popularPaths = useMemo(() => (open ? getPopularCategoryPaths() : []), [open]);
  const trendingPaths = useMemo(() => (open ? getTrendingCategoryPaths() : []), [open]);
  const recommendedPaths = useMemo(() => (open ? getRecommendedCategoryPaths() : []), [open]);

  if (!open) return null;

  const isSearching = debouncedQuery.trim().length >= 2;
  const isRoot = stack.length === 0;
  const currentNodes = isRoot ? categoryTree : stack[stack.length - 1]!.children ?? [];
  const breadcrumb = isRoot ? "All categories" : stack.map((node) => node.name).join(" > ");
  const headerTitle = isRoot ? "Category" : stack[stack.length - 1]!.name;

  const commitSelection = (fullPath: CategoryNode[]) => {
    const segments = segmentsFromPath(fullPath);
    if (segments.length < 2) return;
    selectPath(flatPathFromSegments(segments));
  };

  const handleNode = (node: CategoryNode) => {
    if (node.children?.length) {
      setStack((current) => [...current, node]);
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      return;
    }
    commitSelection([...stack, node]);
  };

  const handleBack = () => {
    if (query) {
      setQuery("");
      setDebouncedQuery("");
      return;
    }
    if (stack.length > 0) {
      setStack((current) => current.slice(0, -1));
      return;
    }
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select a category"
      className="fixed inset-0 z-[200] flex flex-col bg-surface"
    >
      <header
        className="flex items-center gap-ds-2 border-b border-border px-ds-4 pb-ds-3"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className={cn(
            "-ml-ds-1 grid h-12 w-12 shrink-0 place-items-center rounded-ds-md text-text-primary",
            focusRing,
          )}
        >
          <BackIcon />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{headerTitle}</h1>
      </header>

      <div className="border-b border-border px-ds-4 py-ds-3">
        <div className={cn("flex items-center gap-ds-2 rounded-[16px] bg-surface-muted px-ds-3", focusRing)}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            autoComplete="off"
            className="h-12 w-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-ds-4 pt-ds-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {isSearching ? (
          <SearchResults results={searchResults} onSelect={selectPath} />
        ) : isRoot ? (
          <>
            <CategoryHistorySections
              recent={recentPaths}
              frequent={frequentPaths}
              trending={trendingPaths}
              recommended={recommendedPaths}
              popular={popularPaths}
              onSelect={selectPath}
            />
            <ul className="mt-ds-4 flex flex-col gap-ds-2" role="list">
              {currentNodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => handleNode(node)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[16px] bg-surface-muted/60 text-left transition-colors active:bg-surface-muted",
                        focusRing,
                      )}
                      style={{ minHeight: 64, padding: 16 }}
                    >
                      <CategoryIcon slug={node.slug} />
                      <span className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
                        {node.name}
                      </span>
                      {hasChildren ? <ChevronRight /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <ul className="flex flex-col gap-ds-2" role="list">
            <li aria-hidden className="px-ds-1 pb-ds-1 text-xs font-medium text-text-muted">
              {breadcrumb}
            </li>
            {currentNodes.map((node) => {
              const hasChildren = Boolean(node.children?.length);
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => handleNode(node)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[16px] bg-surface-muted/60 text-left transition-colors active:bg-surface-muted",
                      focusRing,
                    )}
                    style={{ minHeight: 64, padding: 16 }}
                  >
                    <span className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
                      {node.name}
                    </span>
                    {hasChildren ? <ChevronRight /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryHistorySections({
  recent,
  frequent,
  trending,
  recommended,
  popular,
  onSelect,
}: {
  recent: FlatCategoryPath[];
  frequent: FlatCategoryPath[];
  trending: FlatCategoryPath[];
  recommended: FlatCategoryPath[];
  popular: FlatCategoryPath[];
  onSelect: (path: FlatCategoryPath) => void;
}) {
  const dedupe = (paths: FlatCategoryPath[], exclude: FlatCategoryPath[]) =>
    paths.filter((path) => !exclude.some((item) => item.pathLabel === path.pathLabel));

  const sections = [
    { title: "Recently used", paths: recent },
    { title: "Trending", paths: dedupe(trending, recent) },
    { title: "Recommended", paths: dedupe(recommended, [...recent, ...trending]) },
    {
      title: "Frequently used",
      paths: dedupe(frequent, [...recent, ...trending, ...recommended]),
    },
    { title: "Popular categories", paths: popular },
  ].filter((section) => section.paths.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-ds-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-ds-2" role="list">
            {section.paths.map((path) => (
              <li key={path.segments.map((segment) => segment.slug).join("/")}>
                <button
                  type="button"
                  onClick={() => onSelect(path)}
                  className={cn(
                    "flex w-full flex-col justify-center gap-0.5 rounded-[16px] bg-surface-muted/60 text-left transition-colors active:bg-surface-muted",
                    focusRing,
                  )}
                  style={{ minHeight: 56, padding: 14 }}
                >
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {path.segments.at(-1)?.name ?? path.subcategoryName}
                  </span>
                  <span className="truncate text-xs text-text-muted">{path.pathLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SearchResults({
  results,
  onSelect,
}: {
  results: CategoryPickerResult[];
  onSelect: (path: FlatCategoryPath) => void;
}) {
  if (results.length === 0) {
    return (
      <p className="px-ds-1 py-ds-6 text-center text-sm text-text-muted">
        No categories found. Try a different word.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-ds-2" role="list">
      {results.map((result) => (
        <li key={result.path.segments.map((segment) => segment.slug).join("/")}>
          <button
            type="button"
            onClick={() => onSelect(result.path)}
            className={cn(
              "flex w-full flex-col justify-center gap-0.5 rounded-[16px] bg-surface-muted/60 text-left transition-colors active:bg-surface-muted",
              focusRing,
            )}
            style={{ minHeight: 64, padding: 16 }}
          >
            <span className="truncate text-base font-semibold text-text-primary">{result.matchName}</span>
            <span className="truncate text-xs text-text-muted">{result.breadcrumb}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
