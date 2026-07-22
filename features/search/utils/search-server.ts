import {
  getRecentPublishedListings,
} from "@/lib/listings/repository";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { getCategoryBreadcrumbMap } from "@/lib/categories/server";
import { getTrendingSearches } from "@/lib/search/trending";
import { getPopularSearches } from "@/lib/search/popular-searches";
import {
  defaultCategories,
  filterSuggestions,
} from "@/lib/search/defaults";
import { MANUAL_LISTING_CITIES } from "@/lib/sell/listing-location";
import type { Product } from "@/lib/products/types";
import type {
  SearchBrand,
  SearchLocation,
  SearchResults,
  SearchStore,
  SearchUser,
} from "@/features/search/types";
import { SEARCH_PRODUCT_PAGE_SIZE } from "@/features/search/types";
import { createClient } from "@/lib/supabase/server";
import { resolveStoreHrefFromSeller } from "@/lib/store/store-href";
import { rankSearchProducts } from "@/lib/search/rank-products";
import { withSearchCache } from "@/lib/search/cache";

const SUGGESTED_LIMIT = 8;

/**
 * Attach the full canonical category breadcrumb path to each product using a
 * single batched categories read. Server-computed so the client renders
 * clickable, canonical paths without any extra request or hardcoded taxonomy.
 */
async function withBreadcrumbs(products: Product[]): Promise<Product[]> {
  if (!products.length) return products;
  const map = await getCategoryBreadcrumbMap(products.map((product) => product.categoryId));
  return products.map((product) => ({
    ...product,
    categoryBreadcrumbs: product.categoryId ? (map.get(product.categoryId) ?? []) : [],
  }));
}

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

async function searchBrands(query: string, limit = 5): Promise<SearchBrand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("name")
    .ilike("name", `%${query}%`)
    .limit(limit);

  return (data ?? []).map((row) => ({
    name: row.name,
    href: `/search?q=${encodeURIComponent(row.name)}&brand=${encodeURIComponent(row.name)}`,
  }));
}

async function getSuggestedBrands(limit = SUGGESTED_LIMIT): Promise<SearchBrand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("name").order("name").limit(limit);

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

function memberHref(profile: { id: string; username: string | null }): string {
  const storeHref = resolveStoreHrefFromSeller({
    sellerId: profile.id,
    storeSlug: profile.username,
  });
  if (storeHref) return storeHref;
  if (profile.username) return `/user/${profile.username}`;
  return `/store/${profile.id}`;
}

function mapProfilesToUsers(
  profiles: Array<{ id: string; full_name: string | null; username: string | null }>,
): SearchUser[] {
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.username || profile.full_name || "Member",
    handle: profile.username ? `@${profile.username}` : "",
    href: memberHref(profile),
  }));
}

function mapProfilesToStores(
  profiles: Array<{ id: string; full_name: string | null; username: string | null }>,
): SearchStore[] {
  const stores: SearchStore[] = [];
  for (const profile of profiles) {
    const href = resolveStoreHrefFromSeller({
      sellerId: profile.id,
      storeSlug: profile.username,
    });
    if (!href) continue;
    stores.push({
      id: profile.id,
      name: profile.username || profile.full_name || "Store",
      href,
      description: profile.full_name?.trim() || "",
    });
  }
  return stores;
}

function suggestedStoresFromListings(products: Product[], limit = SUGGESTED_LIMIT): SearchStore[] {
  const seen = new Set<string>();
  const stores: SearchStore[] = [];

  for (const product of products) {
    const sellerId = product.sellerId?.trim();
    if (!sellerId || seen.has(sellerId)) continue;
    seen.add(sellerId);

    const href = resolveStoreHrefFromSeller({
      sellerId,
      storeSlug: product.sellerUsername,
    });
    if (!href) continue;

    stores.push({
      id: sellerId,
      name: product.sellerUsername || product.sellerName || "Store",
      href,
      description: product.sellerName || "",
    });

    if (stores.length >= limit) break;
  }

  return stores;
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
    // Idle overlay: discovery chips only — never Homepage feed / cards.
    // Automatic cache → DB fail-safe. Suggestions fail → popular fallback.
    const recent = await getRecentPublishedListings(SUGGESTED_LIMIT);
    const [trending, popular, brands] = await Promise.all([
      getTrendingSearches(recent, SUGGESTED_LIMIT),
      getPopularSearches(SUGGESTED_LIMIT).catch(() => [] as string[]),
      withSearchCache(
        "hot",
        "suggested-brands",
        () => getSuggestedBrands(SUGGESTED_LIMIT),
        { ttlMs: 120_000, emptyOnError: [] },
      ),
    ]);

    const trendingSafe = trending.length > 0 ? trending : popular;

    return {
      products: [],
      sellers: [],
      stores: suggestedStoresFromListings(recent, SUGGESTED_LIMIT),
      users: [],
      trending: trendingSafe,
      popular,
      categories: defaultCategories,
      brands,
      locations: [],
      productsHasMore: false,
      productsOffset: 0,
    };
  }

  const [{ items: products, hasMore }, profileMatches, brands, trendingRaw, popularRaw] =
    await Promise.all([
      getEligibleListings({
        surface: "search",
        query: normalized,
        page,
        pageSize: productLimit,
        // Default: marketplace discovery order, then Search Engine v1.0 rank.
        // Explicit newest/price sorts skip relevance re-rank.
        sort: options.sort,
        brand: options.brand,
        categorySlug: options.categorySlug,
        sellerId: options.sellerId,
        locationCity: options.locationCity,
      }),
      searchProfiles(normalized),
      searchBrands(normalized),
      getTrendingSearches([], SUGGESTED_LIMIT).catch(() => [] as string[]),
      getPopularSearches(SUGGESTED_LIMIT).catch(() => [] as string[]),
    ]);

  const users = mapProfilesToUsers(profileMatches);
  const mappedStores = mapProfilesToStores(profileMatches);
  // STORE SEARCH FAILS → MEMBER SEARCH (profiles always mapped to members)
  const stores =
    mappedStores.length > 0
      ? mappedStores
      : users.map((user) => ({
          id: user.id,
          name: user.name,
          href: user.href,
          description: user.handle,
        }));

  const breadcrumbed = await withBreadcrumbs(products);
  const ranked =
    options.sort === "newest" ||
    options.sort === "price_asc" ||
    options.sort === "price_desc"
      ? breadcrumbed
      : rankSearchProducts(breadcrumbed, normalized);

  const filteredTrending = filterSuggestions(trendingRaw, normalized);
  const filteredPopular = filterSuggestions(popularRaw, normalized);
  const trendingSafe = filteredTrending.length > 0 ? filteredTrending : filteredPopular;

  return {
    products: ranked,
    sellers: [],
    stores,
    users,
    trending: trendingSafe,
    popular: filteredPopular,
    categories: defaultCategories.filter((category) => includesQuery(category.name, normalized)),
    brands,
    locations: searchLocations(normalized),
    productsHasMore: hasMore,
    productsOffset: productOffset + products.length,
  };
}
