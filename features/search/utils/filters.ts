import type { ReadonlyURLSearchParams } from "next/navigation";
import type { SearchFilterValues } from "@/features/search/components/SearchFilters";

export function parseSearchFilters(
  params: ReadonlyURLSearchParams | URLSearchParams,
): SearchFilterValues {
  const sort = params.get("sort");
  return {
    minPrice: params.get("minPrice") ?? undefined,
    maxPrice: params.get("maxPrice") ?? undefined,
    condition: params.get("condition") ?? undefined,
    brand: params.get("brand") ?? undefined,
    category: params.get("category") ?? undefined,
    sort:
      sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : "newest",
    postedToday: params.get("postedToday") === "1",
    delivery: params.get("delivery") === "1",
    collection: params.get("collection") === "1",
    inStock: params.get("inStock") === "1",
  };
}

export function serializeSearchFilters(
  values: SearchFilterValues & { q?: string; page?: string },
): URLSearchParams {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.minPrice) params.set("minPrice", values.minPrice);
  if (values.maxPrice) params.set("maxPrice", values.maxPrice);
  if (values.condition) params.set("condition", values.condition);
  if (values.brand) params.set("brand", values.brand);
  if (values.category) params.set("category", values.category);
  if (values.sort && values.sort !== "newest") params.set("sort", values.sort);
  if (values.postedToday) params.set("postedToday", "1");
  if (values.delivery) params.set("delivery", "1");
  if (values.collection) params.set("collection", "1");
  if (values.inStock) params.set("inStock", "1");
  if (values.page) params.set("page", values.page);
  return params;
}

export function filtersToSearchOptions(
  filters: SearchFilterValues,
  query: string,
  page: number,
) {
  return {
    query,
    page,
    pageSize: 24,
    categorySlug: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    conditions: filters.condition ? [filters.condition] : undefined,
    postedToday: filters.postedToday,
    deliveryAvailable: filters.delivery,
    collectionOnly: filters.collection,
    inStock: filters.inStock,
    sort: filters.sort ?? "newest",
  };
}
