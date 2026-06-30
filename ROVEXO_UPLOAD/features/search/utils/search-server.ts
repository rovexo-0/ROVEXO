import { searchListings as searchListingsRepo } from "@/lib/listings/repository";
import {
  defaultCategories,
  defaultSuggestedSellers,
  defaultTrendingSearches,
  filterSuggestions,
  filterSellers,
} from "@/lib/search/defaults";
import { MANUAL_LISTING_CITIES } from "@/lib/sell/listing-location";
import type { SearchBrand, SearchLocation, SearchResults } from "@/features/search/types";
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
  locationCity?: string;
};

async function searchBrands(query: string): Promise<SearchBrand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("name")
    .ilike("name", `%${query}%`)
    .limit(5);

  return (data ?? []).map((row) => ({
    name: row.name,
    href: `/search?q=${encodeURIComponent(row.name)}&brand=${encodeURIComponent(row.name)}`,
  }));
}

function searchLocations(query: string): SearchLocation[] {
  return MANUAL_LISTING_CITIES.filter((city) => includesQuery(city, query))
    .slice(0, 5)
    .map((name) => ({
      name,
      href: `/search?q=${encodeURIComponent(name)}&location=${encodeURIComponent(name)}`,
    }));
}

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
      brands: [],
      locations: [],
      productsHasMore: false,
      productsOffset: 0,
    };
  }

  const [{ items: products, hasMore }, profileMatches, brands] = await Promise.all([
    searchListingsRepo({
      query: normalized,
      page,
      pageSize: productLimit,
      sort: options.sort ?? "newest",
      brand: options.brand,
      categorySlug: options.categorySlug,
      sellerId: options.sellerId,
      locationCity: options.locationCity,
    }),
    searchProfiles(normalized),
    searchBrands(normalized),
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
    brands,
    locations: searchLocations(normalized),
    productsHasMore: hasMore,
    productsOffset: productOffset + products.length,
  };
}
