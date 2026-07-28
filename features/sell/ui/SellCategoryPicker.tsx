"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { ModalContainer } from "@/components/ui/ModalContainer";

import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";

import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellPanelHeader } from "@/features/sell/ui/SellPrimitives";
import { CanonicalMenuRow } from "@/src/components/canonical";

import { categoryTree } from "@/lib/categories/tree";

import { loadCategoriesWithRecovery } from "@/lib/categories/category-loader";

import { CategoryMasterIcon } from "@/features/account-center/components/MasterMenuIcon";

import { segmentsFromPath } from "@/lib/categories/navigation";

import {
  flatPathFromSegments,
  type CategoryNode,
  type FlatCategoryPath,
} from "@/lib/categories/types";

import { recordCategorySelection } from "@/lib/categories/category-history";

import {
  detectCategoryFromTitle,
  POSSIBLE_MATCH_MIN,
} from "@/lib/sell/category-detection-pro";

import type { TitleCategorySuggestion } from "@/lib/sell/suggest-category-from-title";

type Props = {
  open: boolean;

  onClose: () => void;

  onSelect: (path: FlatCategoryPath) => void;

  title?: string;

  description?: string;
};

function SuggestedCategoryRow({
  suggestion,
  onSelect,
}: {
  suggestion: TitleCategorySuggestion;
  onSelect: (path: FlatCategoryPath) => void;
}) {
  const segments = suggestion.path.segments;
  const label = segments.map((segment) => segment.name).join(" › ");
  const rootSlug = segments[0]?.slug ?? suggestion.path.categorySlug;

  return (
    <li>
      <CanonicalMenuRow
        title={label}
        value="Suggested"
        icon={<CategoryMasterIcon slug={rootSlug} />}
        onClick={() => onSelect(suggestion.path)}
        showChevron
      />
    </li>
  );
}

export function SellCategoryPicker({
  open,
  onClose,
  onSelect,
  title = "",
  description = "",
}: Props) {
  const [stack, setStack] = useState<CategoryNode[]>([]);

  const [tree, setTree] = useState<CategoryNode[]>(categoryTree);

  const [search, setSearch] = useState("");

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

  const detection = useMemo(() => {
    if (!title.trim()) return null;

    return detectCategoryFromTitle(title, description);
  }, [title, description]);

  const suggestion =
    detection?.top && detection.top.confidence >= POSSIBLE_MATCH_MIN
      ? detection.top
      : null;

  // Absolute Authority: Suggested category label only — never model-branded copy.
  const suggestionLabel = "Suggested category";

  if (!open) return null;

  const isRoot = stack.length === 0;

  const currentNodes = isRoot
    ? tree
    : (stack[stack.length - 1]!.children ?? []);

  const searchQuery = search.trim().toLowerCase();

  const visibleNodes = searchQuery
    ? currentNodes.filter((node) =>
        node.name.toLowerCase().includes(searchQuery),
      )
    : currentNodes;

  const headerTitle = isRoot ? "Category" : stack[stack.length - 1]!.name;

  const breadcrumb = isRoot
    ? "All categories"
    : stack.map((node) => node.name).join(" › ");

  const close = () => {
    setStack([]);

    setSearch("");

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

      lockScroll={false}
    >
      <div
        className={cn(
          sellPanel,
          "sell-compact-picker flex min-h-0 flex-1 flex-col",
        )}
      >
        <SellPanelHeader title={headerTitle} onBack={handleBack} />

        <div className="border-b border-border px-0 py-1.5">
          <label className="sr-only" htmlFor="sell-category-search">
            Search categories
          </label>
          <input
            id="sell-category-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            autoComplete="off"
            className={cn("cds-input w-full", focusRing)}
          />
        </div>

        <div
          ref={bodyRef}
          className={cn(
            RX_MODAL_BODY,
            "min-h-0 flex-1 overflow-y-auto overscroll-contain pt-1",
          )}
        >
          {isRoot ? (
            <>
              <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {suggestionLabel}
              </p>
              {suggestion ? (
                <ul className="mb-2 flex flex-col gap-1" role="list">
                  <SuggestedCategoryRow
                    suggestion={suggestion}
                    onSelect={commit}
                  />
                </ul>
              ) : (
                <p className="px-1 pb-2 text-sm text-text-secondary">
                  Add a title to see a suggested category.
                </p>
              )}
              <div
                className="mb-2 border-t border-border"
                role="separator"
                aria-hidden
              />
              <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Choose another category
              </p>
            </>
          ) : null}

          {!isRoot ? (
            <p className="px-ds-1 pb-ds-2 text-xs font-medium text-text-muted">
              {breadcrumb}
            </p>
          ) : null}

          <ul className="flex flex-col gap-ds-2" role="list">
            {visibleNodes.map((node) => {
              const hasChildren = Boolean(node.children?.length);

              return (
                <li key={node.id}>
                  <CanonicalMenuRow
                    title={node.name}
                    icon={<CategoryMasterIcon slug={node.slug} />}
                    onClick={() => handleNode(node)}
                    showChevron={hasChildren}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </ModalContainer>
  );
}
