import type { SearchResults } from "@/features/search/types";
import { SEARCH_PRODUCT_PAGE_SIZE } from "@/features/search/types";

type FetchSearchParams = {
  query: string;
  productOffset?: number;
  productLimit?: number;
  signal?: AbortSignal;
};

export async function fetchSearchResults({
  query,
  productOffset = 0,
  productLimit = SEARCH_PRODUCT_PAGE_SIZE,
  signal,
}: FetchSearchParams): Promise<SearchResults> {
  const params = new URLSearchParams({
    q: query,
    offset: String(productOffset),
    limit: String(productLimit),
  });

  const response = await fetch(`/api/search?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json() as Promise<SearchResults>;
}
