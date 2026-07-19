"use client";

import { getCategoryTree } from "@/lib/categories/queries";
import { cn } from "@/lib/cn";
import { SearchLocationFilter } from "@/features/search/components/SearchLocationFilter";
import type { SearchLocationMode } from "@/features/search/utils/location-preference";

export type SearchFilterValues = {
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  brand?: string;
  category?: string;
  location?: string;
  scope?: "products" | "auctions" | "businesses" | "sellers";
  sort?: "newest" | "price_asc" | "price_desc" | "most_viewed" | "nearest";
  postedToday?: boolean;
  delivery?: boolean;
  collection?: boolean;
  inStock?: boolean;
};

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

type SearchFiltersProps = {
  values: SearchFilterValues;
  onChange: (values: SearchFilterValues) => void;
  onLocationChange?: (mode: SearchLocationMode, city?: string) => void;
  sticky?: boolean;
};

export function SearchFilters({
  values,
  onChange,
  onLocationChange,
  sticky = true,
}: SearchFiltersProps) {
  const categories = getCategoryTree();

  function update(partial: Partial<SearchFilterValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <section
      aria-label="Search filters"
      className={cn(
        "rx-form-section border-border bg-background",
        sticky && "sticky top-0 z-20 border-b",
      )}
    >
      <div className="flex flex-col gap-ds-3 p-ds-3 sm:p-ds-4">
        <div className="-mx-ds-1 flex gap-ds-2 overflow-x-auto pb-ds-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <label className="flex min-w-[9.5rem] shrink-0 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Category
            <select
              value={values.category ?? ""}
              onChange={(event) => update({ category: event.target.value || undefined })}
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[7rem] shrink-0 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Min price
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={values.minPrice ?? ""}
              onChange={(event) => update({ minPrice: event.target.value || undefined })}
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Minimum price"
            />
          </label>

          <label className="flex min-w-[7rem] shrink-0 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Max price
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={values.maxPrice ?? ""}
              onChange={(event) => update({ maxPrice: event.target.value || undefined })}
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Maximum price"
            />
          </label>

          <label className="flex min-w-[8.5rem] shrink-0 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Condition
            <select
              value={values.condition ?? ""}
              onChange={(event) => update({ condition: event.target.value || undefined })}
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Condition"
            >
              <option value="">Any</option>
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[9rem] shrink-0 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Sort
            <select
              value={values.sort ?? "newest"}
              onChange={(event) =>
                update({ sort: event.target.value as SearchFilterValues["sort"] })
              }
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Sort results"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="most_viewed">Most viewed</option>
              <option value="nearest">Nearest</option>
            </select>
          </label>
        </div>

        {onLocationChange ? (
          <SearchLocationFilter onChange={onLocationChange} compact />
        ) : null}

        <div className="flex flex-wrap items-end gap-ds-4 text-sm text-text-secondary">
          <label className="flex min-w-[10rem] flex-1 flex-col gap-ds-1 text-xs font-medium text-text-secondary">
            Brand
            <input
              type="search"
              value={values.brand ?? ""}
              onChange={(event) => update({ brand: event.target.value || undefined })}
              placeholder="Any brand"
              className="rx-input min-h-ds-7 px-ds-3 text-sm"
              aria-label="Brand"
            />
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-ds-2">
            <input
              type="checkbox"
              checked={values.postedToday ?? false}
              onChange={(event) => update({ postedToday: event.target.checked || undefined })}
            />
            Posted today
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-ds-2">
            <input
              type="checkbox"
              checked={values.delivery ?? false}
              onChange={(event) => update({ delivery: event.target.checked || undefined })}
            />
            Delivery
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-ds-2">
            <input
              type="checkbox"
              checked={values.collection ?? false}
              onChange={(event) => update({ collection: event.target.checked || undefined })}
            />
            Collection
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-ds-2">
            <input
              type="checkbox"
              checked={values.inStock ?? false}
              onChange={(event) => update({ inStock: event.target.checked || undefined })}
            />
            In stock
          </label>
        </div>
      </div>
    </section>
  );
}
