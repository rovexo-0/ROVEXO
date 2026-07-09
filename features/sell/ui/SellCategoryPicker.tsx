"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { categoryTree } from "@/lib/categories/tree";
import { loadCategoriesWithRecovery } from "@/lib/categories/category-loader";
import { getCategoryIcon, getCategoryImageUrl } from "@/lib/categories/visuals";
import { segmentsFromPath } from "@/lib/categories/navigation";
import { flatPathFromSegments, type CategoryNode, type FlatCategoryPath } from "@/lib/categories/types";
import {
  searchCategoryPicker,
  warmCategoryPickerIndex,
  type CategoryPickerResult,
} from "@/lib/sell/category-picker-search";
import { recordCategorySelection } from "@/lib/categories/category-history";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: FlatCategoryPath) => void;
};

const SEARCH_DEBOUNCE_MS = 40;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights every query word within a label (title or breadcrumb). Purely
 * presentational — no filtering or reordering — so duplicate-named results stay
 * visible and become easy to scan by their highlighted matches + full path.
 */
function highlightQuery(text: string, query: string): ReactNode {
  const words = Array.from(
    new Set(
      query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 2),
    ),
  );
  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  const wordSet = new Set(words);

  return parts.map((part, index) => {
    if (part === "") return null;
    return wordSet.has(part.toLowerCase()) ? (
      <mark
        key={index}
        className="rounded-sm bg-primary/15 px-0.5 font-semibold text-primary not-italic"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    );
  });
}

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

function CategoryThumb({ slug }: { slug: string }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-ds-md bg-surface-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getCategoryImageUrl(slug)}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="h-10 w-10 rounded-ds-sm object-cover"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "grid";
        }}
      />
      <span className="hidden h-10 w-10 place-items-center text-xl" aria-hidden>
        {getCategoryIcon(slug)}
      </span>
    </span>
  );
}

export function SellCategoryPicker({ open, onClose, onSelect }: Props) {
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tree, setTree] = useState<CategoryNode[]>(categoryTree);
  const treeRequested = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) warmCategoryPickerIndex();
  }, [open]);

  useEffect(() => {
    if (!open || treeRequested.current) return;
    treeRequested.current = true;
    let cancelled = false;
    void loadCategoriesWithRecovery().then((result) => {
      if (!cancelled && result.tree.length > 0) setTree(result.tree);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const searchResults = useMemo<CategoryPickerResult[]>(
    () => (debouncedQuery.trim().length >= 2 ? searchCategoryPicker(debouncedQuery) : []),
    [debouncedQuery],
  );

  if (!open) return null;

  const isSearching = debouncedQuery.trim().length >= 2;
  const isRoot = stack.length === 0;
  const currentNodes = isRoot ? tree : stack[stack.length - 1]!.children ?? [];
  const headerTitle = isRoot ? "Category" : stack[stack.length - 1]!.name;
  const breadcrumb = isRoot ? "All categories" : stack.map((node) => node.name).join(" › ");

  const close = () => {
    setStack([]);
    setQuery("");
    setDebouncedQuery("");
    onClose();
  };

  const commit = (path: FlatCategoryPath) => {
    recordCategorySelection(path);
    onSelect(path);
    close();
  };

  const handleNode = (node: CategoryNode) => {
    if (node.children?.length) {
      setStack((current) => [...current, node]);
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      return;
    }
    const segments = segmentsFromPath([...stack, node]);
    if (segments.length < 2) return;
    commit(flatPathFromSegments(segments));
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
    close();
  };

  return (
    <ModalContainer
      open={open}
      onClose={close}
      variant="fullscreen"
      zIndex={200}
      ariaLabel="Select a category"
    >
      <div className={sellPanel}>
      <header
        className="flex items-center gap-ds-2 border-b border-border px-ds-2 pb-ds-3"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <button type="button" onClick={handleBack} aria-label="Back" className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-ds-md text-text-primary", focusRing)}>
          <BackIcon />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{headerTitle}</h1>
      </header>

      <div className="border-b border-border px-ds-4 py-ds-3">
        <div className={cn("flex items-center gap-ds-2 rounded-ds-md bg-surface-muted px-ds-3", focusRing)}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            autoComplete="off"
            className="h-11 w-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="grid h-8 w-8 shrink-0 place-items-center rounded-ds-full text-text-muted">
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div ref={bodyRef} className={cn(RX_MODAL_BODY, "px-ds-4 pt-ds-3")}>
        {isSearching ? (
          searchResults.length === 0 ? (
            <p className="px-ds-1 py-ds-6 text-center text-sm text-text-muted">No categories found. Try a different word.</p>
          ) : (
            <ul className="flex flex-col gap-ds-2" role="list">
              {searchResults.map((result) => (
                <li
                  key={`${result.path.segments
                    .map((segment) => segment.slug)
                    .join("/")}#${result.matchDepth}`}
                >
                  <button
                    type="button"
                    onClick={() => commit(result.path)}
                    className={cn("flex w-full flex-col justify-center gap-0.5 rounded-ds-md bg-surface-muted/60 px-ds-4 py-ds-3 text-left transition-colors active:bg-surface-muted", focusRing)}
                  >
                    <span className="truncate text-base font-semibold text-text-primary">
                      {highlightQuery(result.matchName, debouncedQuery)}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {highlightQuery(result.breadcrumb, debouncedQuery)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            {!isRoot ? <p className="px-ds-1 pb-ds-2 text-xs font-medium text-text-muted">{breadcrumb}</p> : null}
            <ul className="flex flex-col gap-ds-2" role="list">
              {currentNodes.map((node) => {
                const hasChildren = Boolean(node.children?.length);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => handleNode(node)}
                      className={cn("flex min-h-[60px] w-full items-center gap-ds-3 rounded-ds-md bg-surface-muted/60 p-ds-3 text-left transition-colors active:bg-surface-muted", focusRing)}
                    >
                      {isRoot ? <CategoryThumb slug={node.slug} /> : null}
                      <span className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">{node.name}</span>
                      {hasChildren ? <ChevronRight /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      </div>
    </ModalContainer>
  );
}
