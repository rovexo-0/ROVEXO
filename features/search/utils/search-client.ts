import type { SearchResults } from "@/features/search/types";

export function hasSearchResults(results: SearchResults): boolean {
  return (
    results.products.length > 0 ||
    results.sellers.length > 0 ||
    results.stores.length > 0 ||
    results.users.length > 0 ||
    results.categories.length > 0
  );
}

export function mergeProductResults(
  current: SearchResults,
  nextPage: SearchResults,
): SearchResults {
  return {
    ...nextPage,
    products: [...current.products, ...nextPage.products],
  };
}
