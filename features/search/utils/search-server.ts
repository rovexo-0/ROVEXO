import { searchListings as searchListingsRepo } from "@/lib/listings/repository";
import {
  defaultCategories,
  defaultSuggestedSellers,
  defaultTrendingSearches,
  filterSuggestions,
  filterSellers,
} from "@/lib/search/defaults";
import type { SearchResults } from "@/features/search/types";
import { SEARCH_PRODUCT_PAGE_SIZE } from "@/features/search/types";
import { createClient } from "@/lib/supabase/server";

function includesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

type SearchAllOptions = {
  productOffset?: number;
  productLimit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  brand?: string;
  categorySlug?: string;
  sellerId?: string;
};

async function searchProfiles(query: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(5);

  return data ?? [];
}

export async function searchAll(
  query: string,
  options: SearchAllOptions = {},
): Promise<SearchResults> {
  const normalized = query.trim();
  const productOffset = options.productOffset ?? 0;
  const productLimit = options.productLimit ?? SEARCH_PRODUCT_PAGE_SIZE;
  const page = Math.floor(productOffset / productLimit) + 1;

  if (!normalized) {
    return {
      products: [],
      sellers: defaultSuggestedSellers,
      stores: [],
      users: [],
      trending: defaultTrendingSearches,
      categories: defaultCategories,
      productsHasMore: false,
      productsOffset: 0,
    };
  }

  const [{ items: products, hasMore }, profileMatches] = await Promise.all([
    searchListingsRepo({
      query: normalized,
      page,
      pageSize: productLimit,
      sort: options.sort ?? "newest",
      brand: options.brand,
      categorySlug: options.categorySlug,
      sellerId: options.sellerId,
    }),
    searchProfiles(normalized),
  ]);

  return {
    products,
    sellers: filterSellers(
      profileMatches.length
        ? profileMatches.map((profile) => ({
            id: profile.id,
            name: profile.full_name,
            handle: `@${profile.username}`,
            href: `/user/${profile.username}`,
          }))
        : defaultSuggestedSellers,
      normalized,
    ),
    stores: [],
    users: profileMatches.map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      handle: `@${profile.username}`,
      href: `/user/${profile.username}`,
    })),
    trending: filterSuggestions(defaultTrendingSearches, normalized),
    categories: defaultCategories.filter((category) => includesQuery(category.name, normalized)),
    productsHasMore: hasMore,
    productsOffset: productOffset + products.length,
  };
}
