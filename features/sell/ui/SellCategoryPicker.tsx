"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { categoryTree } from "@/lib/categories/tree";
import { loadCategoriesWithRecovery } from "@/lib/categories/category-loader";
import { getCategoryIcon, getCategoryImageUrl } from "@/lib/categories/visuals";
import { segmentsFromPath } from "@/lib/categories/navigation";
import { flatPathFromSegments, type CategoryNode, type FlatCategoryPath } from "@/lib/categories/types";
import { recordCategorySelection } from "@/lib/categories/category-history";
import {
  detectCategoryFromTitle,
  SUGGEST_CONFIDENCE_MIN,
} from "@/lib/sell/category-detection-pro";
import type { TitleCategorySuggestion } from "@/lib/sell/suggest-category-from-title";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: FlatCategoryPath) => void;
  /** Listing title — drives high-confidence category suggestions (never auto-selects). */
  title?: string;
  description?: string;
};

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

function SuggestedCategoryRow({
  suggestion,
  onSelect,
}: {
  suggestion: TitleCategorySuggestion;
  onSelect: (path: FlatCategoryPath) => void;
}) {
  const segments = suggestion.path.segments;
  const vertical = segments[0]?.name ?? "";
  const leaf = segments[segments.length - 1]?.name ?? "";

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(suggestion.path)}
        className={cn(
          "flex w-full flex-col items-start gap-0.5 rounded-ds-md bg-surface-muted/60 px-ds-4 py-ds-3 text-left transition-colors active:bg-surface-muted",
          focusRing,
        )}
      >
        <span className="text-base font-semibold text-text-primary">{vertical}</span>
        <span className="text-sm text-text-muted" aria-hidden>
          ↓
        </span>
        <span className="text-base font-semibold text-text-primary">{leaf}</span>
      </button>
    </li>
  );
}

export function SellCategoryPicker({ open, onClose, onSelect, title = "", description = "" }: Props) {
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>(categoryTree);
  const treeRequested = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const suggestions = useMemo(() => {
    if (!title.trim()) return [];
    const detection = detectCategoryFromTitle(title, description);
    return detection.suggestions.filter((item) => item.confidence >= SUGGEST_CONFIDENCE_MIN);
  }, [title, description]);

  if (!open) return null;

  const isRoot = stack.length === 0;
  const currentNodes = isRoot ? tree : stack[stack.length - 1]!.children ?? [];
  const headerTitle = isRoot ? "Category" : stack[stack.length - 1]!.name;
  const breadcrumb = isRoot ? "All categories" : stack.map((node) => node.name).join(" › ");

  const close = () => {
    setStack([]);
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

        <div ref={bodyRef} className={cn(RX_MODAL_BODY, "px-ds-4 pt-ds-3")}>
          {isRoot && suggestions.length > 0 ? (
            <>
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Suggested</p>
              <ul className="mb-ds-4 flex flex-col gap-ds-2" role="list">
                {suggestions.map((suggestion) => (
                  <SuggestedCategoryRow
                    key={suggestion.path.segments.map((segment) => segment.slug).join("/")}
                    suggestion={suggestion}
                    onSelect={commit}
                  />
                ))}
              </ul>
              <div className="mb-ds-3 border-t border-border" role="separator" aria-hidden />
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">All categories</p>
            </>
          ) : null}

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
        </div>
      </div>
    </ModalContainer>
  );
}
