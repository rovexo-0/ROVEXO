import type { ReadonlyURLSearchParams } from "next/navigation";

export type SearchFilterValues = {
  category?: string;
  q?: string;
  page?: string;
};

export function parseSearchFilters(
  params: ReadonlyURLSearchParams | URLSearchParams,
): SearchFilterValues {
  return {
    category: params.get("category") ?? undefined,
    q: params.get("q") ?? undefined,
    page: params.get("page") ?? undefined,
  };
}

export function serializeSearchFilters(values: SearchFilterValues): URLSearchParams {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.category) params.set("category", values.category);
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
    sort: "newest" as const,
  };
}
