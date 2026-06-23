"use client";

import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { IconButton } from "@/components/ui/IconButton";
import { ProductCard } from "@/components/ui/ProductCard";
import { cn } from "@/lib/cn";
import { productToCardProps } from "@/lib/products/card";
import { focusRing } from "@/components/ui/tokens";
import { EmptyState } from "@/components/ui/EmptyState";
import { SavedEmptyState } from "@/features/saved/components/SavedEmptyState";
import { SearchIcon } from "@/features/messages/icons";
import {
  SAVED_MORE_FILTERS,
  SAVED_PRIMARY_FILTERS,
  type SavedFilterId,
} from "@/lib/saved/categories";
import type { SavedItem, SavedSort } from "@/lib/saved/types";
import { filterSavedItems, SAVED_SORT_OPTIONS, sortSavedItems } from "@/lib/saved/utils";

type SavedPageProps = {
  initialItems: SavedItem[];
};

export function SavedPage({ initialItems }: SavedPageProps) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<SavedFilterId>("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sort, setSort] = useState<SavedSort>("newest");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const visibleItems = useMemo(() => {
    const filtered = filterSavedItems(items, filter, query);
    return sortSavedItems(filtered, sort);
  }, [items, filter, query, sort]);

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  const removeItem = async (slug: string) => {
    const response = await fetch("/api/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlugs: [slug] }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { items: SavedItem[] };
    setItems(payload.items);
    setSelectedSlugs((current) => current.filter((item) => item !== slug));
  };

  const removeSelected = async () => {
    if (selectedSlugs.length === 0) return;

    const response = await fetch("/api/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlugs: selectedSlugs }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { items: SavedItem[] };
    setItems(payload.items);
    setSelectedSlugs([]);
    setEditMode(false);
  };

  const handleFilterChange = (nextFilter: SavedFilterId) => {
    if (nextFilter === "more") {
      setShowMoreFilters((current) => !current);
      return;
    }

    setFilter(nextFilter);
    setShowMoreFilters(false);
  };

  return (
    <BetaAppShell bottomNavTab="saved">
      <header className="premium-page-header sticky top-0 z-50">
        <div className="flex items-center justify-between gap-ds-3 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
          <h1 className="min-w-0 truncate text-2xl font-bold text-text-primary">Saved</h1>
          <IconButton
            label={searchOpen ? "Close search" : "Search saved items"}
            variant="ghost"
            size="md"
            onClick={() => setSearchOpen((current) => !current)}
          >
            <SearchIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {searchOpen && (
          <div className="px-ds-4 pb-ds-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-ds-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search saved items"
                className={cn(
                  "premium-input premium-glass min-h-ds-7 w-full rounded-ds-full pl-ds-8 pr-ds-3 py-ds-2 text-sm placeholder:text-text-muted",
                  focusRing,
                )}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-ds-2 px-ds-4 pb-ds-3">
          <div className="flex gap-ds-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SAVED_PRIMARY_FILTERS.map((item) => (
              <CategoryChip
                key={item.id}
                label={item.label}
                active={item.id === "more" ? showMoreFilters : filter === item.id}
                onClick={() => handleFilterChange(item.id)}
              />
            ))}
          </div>

          {showMoreFilters && (
            <div className="flex gap-ds-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SAVED_MORE_FILTERS.map((item) => (
                <CategoryChip
                  key={item.id}
                  label={item.label}
                  active={filter === item.id}
                  onClick={() => handleFilterChange(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-ds-3 border-t border-border px-ds-4 py-ds-3">
          {editMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-ds-7"
                onClick={() => {
                  setEditMode(false);
                  setSelectedSlugs([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-ds-7 text-danger"
                disabled={selectedSlugs.length === 0}
                onClick={() => void removeSelected()}
              >
                Remove selected
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-ds-7"
                disabled={items.length === 0}
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>

              <label className="sr-only" htmlFor="saved-sort">
                Sort saved items
              </label>
              <select
                id="saved-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SavedSort)}
                className={cn(
                  "premium-input min-h-ds-7 px-ds-3 py-ds-2 text-sm font-medium text-text-primary",
                  focusRing,
                )}
              >
                {SAVED_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        {items.length === 0 ? (
          <SavedEmptyState />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try another category filter or clear your search."
            actionLabel="Show all saved"
            onAction={() => {
              setFilter("all");
              setQuery("");
              setShowMoreFilters(false);
            }}
          />
        ) : (
          <div className="marketplace-listing-grid">
            {visibleItems.map((item) => {
              const selected = selectedSlugs.includes(item.product.slug);
              const cardProps = productToCardProps(item.product);

              return (
                <div
                  key={item.product.slug}
                  className={cn(
                    "relative h-full",
                    editMode && selected && "rounded-ds-lg ring-2 ring-primary",
                  )}
                >
                  {editMode && (
                    <button
                      type="button"
                      aria-label={selected ? "Deselect item" : "Select item"}
                      aria-pressed={selected}
                      onClick={() => toggleSelect(item.product.slug)}
                      className={cn(
                        "premium-chip absolute left-ds-2 top-ds-2 z-20 flex h-6 w-6 items-center justify-center text-xs font-bold",
                        selected && "border-primary bg-primary text-primary-foreground",
                        focusRing,
                      )}
                    >
                      {selected ? "✓" : ""}
                    </button>
                  )}

                  <div className={cn(editMode && "pointer-events-none")}>
                    <ProductCard
                      {...cardProps}
                      isFavorite
                      onFavorite={() => {
                        if (!editMode) void removeItem(item.product.slug);
                      }}
                    />
                  </div>

                  {editMode && (
                    <button
                      type="button"
                      aria-label={`Select ${item.product.title}`}
                      className="absolute inset-0 z-10 rounded-ds-lg"
                      onClick={() => toggleSelect(item.product.slug)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </BetaAppShell>
  );
}
