import { createAdminClient } from "@/lib/supabase/admin";
import { defaultCategories, defaultTrendingSearches } from "@/lib/search/defaults";
import { getPopularSearches } from "@/lib/search/popular-searches";
import {
  readLiveSearchEngineDocument,
  getSearchEngineSnapshotForAdmin,
} from "@/lib/search-engine/engine";
import { SEARCH_ENGINE_MODULES } from "@/lib/search-engine/registry";
import {
  buildSearchDashboard,
  computeSearchAnalytics,
  countEnabledFlags,
  countEnabledItems,
  mergeTrendingSearches,
} from "@/lib/search-engine/timeline";
import type {
  SearchEngineAnalytics,
  SearchEngineContext,
  SearchEngineSnapshot,
} from "@/lib/search-engine/types";

export async function getPublicSearchEngineConfig() {
  return readLiveSearchEngineDocument();
}

export async function getSearchEngineSnapshot(): Promise<SearchEngineSnapshot> {
  const { draft, live, history } = await getSearchEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: SEARCH_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

async function readIndexCounts() {
  const admin = createAdminClient();
  const [listings, categories, sellers, businesses] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("categories").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("business_accounts").select("*", { count: "exact", head: true }),
  ]);

  return {
    listings: listings.count ?? 0,
    categories: categories.count ?? 0,
    sellers: sellers.count ?? 0,
    businesses: businesses.count ?? 0,
  };
}

async function readSearchActivity24h() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: requests } = await admin
    .from("platform_audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "search.query")
    .gte("created_at", since);

  const { count: failed } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .eq("category", "search")
    .gte("created_at", since);

  return {
    searchRequests24h: requests ?? 0,
    failedSearches24h: failed ?? 0,
  };
}

export async function getSearchEngineContext(): Promise<SearchEngineContext> {
  const [config, indexCounts, activity, popularSearches] = await Promise.all([
    readLiveSearchEngineDocument(),
    readIndexCounts(),
    readSearchActivity24h(),
    getPopularSearches().catch(() => [] as string[]),
  ]);

  const dashboard = buildSearchDashboard({
    indexedListings: indexCounts.listings,
    indexedCategories: indexCounts.categories,
    indexedSellers: indexCounts.sellers,
    indexedBusinesses: indexCounts.businesses,
    searchRequests24h: activity.searchRequests24h,
    failedSearches24h: activity.failedSearches24h,
    enabledIndexes: countEnabledItems(config.indexes),
    performanceEnabled: countEnabledFlags(config.performance),
  });

  return {
    dashboard,
    trendingSearches: mergeTrendingSearches(popularSearches),
    popularSearches: popularSearches.length > 0 ? popularSearches : defaultTrendingSearches,
  };
}

export async function getSearchEngineAnalytics(): Promise<SearchEngineAnalytics> {
  const [config, context, activity] = await Promise.all([
    readLiveSearchEngineDocument(),
    getSearchEngineContext(),
    readSearchActivity24h(),
  ]);

  return computeSearchAnalytics({
    trendingSearches: context.trendingSearches,
    popularCategories: defaultCategories.slice(0, 6).map((c) => c.name),
    enabledSearchTypes: countEnabledItems(config.searchTypes),
    enabledFilters: countEnabledFlags(config.filters),
    enabledSortOptions: countEnabledItems(config.sortOptions),
    enabledIndexes: countEnabledItems(config.indexes),
    failedSearches24h: activity.failedSearches24h,
    searchRequests24h: activity.searchRequests24h,
  });
}
