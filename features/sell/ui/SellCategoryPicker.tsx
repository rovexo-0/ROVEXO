"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel } from "@/features/sell/ui/sell-classes";
import { SellFlowHeader } from "@/features/sell/ui/SellPrimitives";
import { SellPickerSectionLabel } from "@/features/sell/ui/SellPickerLeadingMark";
import { CanonicalMenuRow, CanonicalInput } from "@/src/components/canonical";
import { SearchLineIcon } from "@/components/icons/RvxLineIcons";
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
import { CATEGORY_ENGINE_V1 } from "@/lib/sell/category-engine-v1";
import {
  invalidateCategoryPickerIndex,
  searchCategoryPicker,
  warmCategoryPickerIndex,
  type CategoryPickerResult,
} from "@/lib/sell/category-picker-search";
import { invalidateCategorySuggestionIndex } from "@/lib/sell/category-suggestion-engine-v1";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: FlatCategoryPath) => void;
};

/**
 * Manual Category → Subcategory → Product Type picker.
 * Browse = Catalog Master tree. Search = Catalog Master leaf index (same SSOT).
 * Category Engine v1.0 — no AI, auto-category, or title-based ranking.
 */
export function SellCategoryPicker({ open, onClose, onSelect }: Props) {
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>(categoryTree);
  const [search, setSearch] = useState("");
  const treeRequested = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || treeRequested.current) return;
    treeRequested.current = true;
    let cancelled = false;
    invalidateCategoryPickerIndex();
    invalidateCategorySuggestionIndex();
    warmCategoryPickerIndex();
    void loadCategoriesWithRecovery().then((result) => {
      if (!cancelled && result.tree.length > 0) {
        setTree(result.tree);
        invalidateCategoryPickerIndex();
        warmCategoryPickerIndex();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const searchQuery = search.trim();
  const isSearching = searchQuery.length >= 2;

  const searchResults: CategoryPickerResult[] = useMemo(() => {
    if (!isSearching) return [];
    return searchCategoryPicker(searchQuery);
  }, [isSearching, searchQuery]);

  if (!open) return null;

  const isRoot = stack.length === 0;
  const currentNodes = isRoot ? tree : (stack[stack.length - 1]!.children ?? []);
  const visibleNodes = isSearching ? [] : currentNodes;

  const headerTitle = isSearching
    ? "Search"
    : isRoot
      ? "Department"
      : stack.length === 1
        ? "Category"
        : "Product Type";
  const breadcrumb = isRoot
    ? "Department › Category › Product Type"
    : stack.map((node) => node.name).join(" › ");
  const levelHint = isSearching
    ? "Matching product types"
    : isRoot
      ? "Choose department"
      : stack.length === 1
        ? "Choose category"
        : "Choose product type";

  const close = () => {
    setStack([]);
    setSearch("");
    onClose();
  };

  const commit = (path: FlatCategoryPath) => {
    if (path.segments.length !== CATEGORY_ENGINE_V1.depth) return;
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
    // Fail closed: Product Type leaf must complete Category → Subcategory → Product Type.
    if (segments.length !== CATEGORY_ENGINE_V1.depth) return;
    commit(flatPathFromSegments(segments));
  };

  const handleSearchResult = (result: CategoryPickerResult) => {
    commit(result.path);
  };

  const handleBack = () => {
    if (searchQuery) {
      setSearch("");
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
      lockScroll={false}
    >
      <div className={cn(sellPanel, "sell-compact-picker flex min-h-0 flex-1 flex-col")}>
        <SellFlowHeader title={headerTitle} onBack={handleBack} />

        <div className="sell-option-picker__search shrink-0 border-b border-border">
          <span className="sell-option-picker__search-icon" aria-hidden>
            <SearchLineIcon />
          </span>
          <CanonicalInput
            id="sell-category-search"
            inputType="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            autoComplete="off"
            className="sell-option-picker__search-field"
          />
        </div>

        <div
          ref={bodyRef}
          className={cn(
            RX_MODAL_BODY,
            "sell-option-picker__body min-h-0 flex-1 overflow-y-auto overscroll-contain pt-ds-2",
          )}
        >
          {isSearching ? (
            <div className="px-ds-1 pb-ds-2">
              <SellPickerSectionLabel label={levelHint} variant="all" />
            </div>
          ) : isRoot ? (
            <div className="px-ds-1 pb-ds-2">
              <SellPickerSectionLabel label={levelHint} variant="all" />
            </div>
          ) : (
            <>
              <p className="sell-category-picker__breadcrumb px-ds-1">{breadcrumb}</p>
              <div className="px-ds-1 pb-ds-2">
                <SellPickerSectionLabel label={levelHint} variant="all" />
              </div>
            </>
          )}

          {isSearching ? (
            <ul className="flex flex-col gap-ds-1 pb-ds-4" role="list" data-category-engine="v1.0-catalog-search">
              {searchResults.length === 0 ? (
                <li className="sell-category-picker__hint px-ds-1 py-ds-3">No matching product types</li>
              ) : (
                searchResults.map((result) => {
                  const leaf = result.path.segments[result.path.segments.length - 1]!;
                  const key = `${result.path.segments.map((s) => s.slug).join("/")}#${result.matchDepth}`;
                  return (
                    <li key={key}>
                      <CanonicalMenuRow
                        title={result.matchName}
                        description={result.breadcrumb}
                        icon={<CategoryMasterIcon slug={leaf.slug} />}
                        onClick={() => handleSearchResult(result)}
                        showChevron={false}
                      />
                    </li>
                  );
                })
              )}
            </ul>
          ) : (
            <ul className="flex flex-col gap-ds-1 pb-ds-4" role="list" data-category-engine="v1.0-manual">
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
          )}
        </div>
      </div>
    </ModalContainer>
  );
}
