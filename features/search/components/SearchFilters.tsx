"use client";

import { getCategoryTree } from "@/lib/categories/queries";

export type SearchFilterValues = {
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  brand?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  postedToday?: boolean;
  delivery?: boolean;
  collection?: boolean;
  inStock?: boolean;
};

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

type SearchFiltersProps = {
  values: SearchFilterValues;
  onChange: (values: SearchFilterValues) => void;
};

export function SearchFilters({ values, onChange }: SearchFiltersProps) {
  const categories = getCategoryTree();

  function update(partial: Partial<SearchFilterValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <section aria-label="Search filters" className="flex flex-col gap-ds-3 rounded-ds-xl border border-border bg-surface p-ds-4 shadow-ds-soft">
      <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-4">
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Min price
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={values.minPrice ?? ""}
            onChange={(event) => update({ minPrice: event.target.value || undefined })}
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          />
        </label>
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Max price
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={values.maxPrice ?? ""}
            onChange={(event) => update({ maxPrice: event.target.value || undefined })}
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          />
        </label>
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Condition
          <select
            value={values.condition ?? ""}
            onChange={(event) => update({ condition: event.target.value || undefined })}
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          >
            <option value="">Any</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Brand
          <input
            type="search"
            value={values.brand ?? ""}
            onChange={(event) => update({ brand: event.target.value || undefined })}
            placeholder="Any brand"
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-4">
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Category
          <select
            value={values.category ?? ""}
            onChange={(event) => update({ category: event.target.value || undefined })}
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-ds-1 text-xs font-medium text-text-secondary">
          Sort
          <select
            value={values.sort ?? "newest"}
            onChange={(event) =>
              update({ sort: event.target.value as SearchFilterValues["sort"] })
            }
            className="min-h-ds-7 rounded-ds-md border border-border bg-background px-ds-3 text-sm text-text-primary"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-ds-4 text-sm text-text-secondary">
        <label className="inline-flex items-center gap-ds-2">
          <input
            type="checkbox"
            checked={values.postedToday ?? false}
            onChange={(event) => update({ postedToday: event.target.checked || undefined })}
          />
          Posted today
        </label>
        <label className="inline-flex items-center gap-ds-2">
          <input
            type="checkbox"
            checked={values.delivery ?? false}
            onChange={(event) => update({ delivery: event.target.checked || undefined })}
          />
          Delivery
        </label>
        <label className="inline-flex items-center gap-ds-2">
          <input
            type="checkbox"
            checked={values.collection ?? false}
            onChange={(event) => update({ collection: event.target.checked || undefined })}
          />
          Collection
        </label>
        <label className="inline-flex items-center gap-ds-2">
          <input
            type="checkbox"
            checked={values.inStock ?? false}
            onChange={(event) => update({ inStock: event.target.checked || undefined })}
          />
          In stock
        </label>
      </div>
    </section>
  );
}
