import { defaultTrendingSearches } from "@/lib/search/defaults";
import type {
  SearchEngineAnalytics,
  SearchEngineDashboard,
  SearchEngineHealthId,
} from "@/lib/search-engine/types";

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

export function deriveSearchHealth(input: {
  indexedListings: number;
  failedSearches24h: number;
  searchRequests24h: number;
}): SearchEngineHealthId {
  if (input.indexedListings === 0) return "broken";
  if (input.failedSearches24h >= 50) return "degraded";
  if (input.searchRequests24h > 0 && input.failedSearches24h / input.searchRequests24h > 0.2) return "degraded";
  return "healthy";
}

export function buildSearchDashboard(input: {
  indexedListings: number;
  indexedCategories: number;
  indexedSellers: number;
  indexedBusinesses: number;
  searchRequests24h: number;
  failedSearches24h: number;
  enabledIndexes: number;
  performanceEnabled: number;
}): SearchEngineDashboard {
  const searchHealth = deriveSearchHealth({
    indexedListings: input.indexedListings,
    failedSearches24h: input.failedSearches24h,
    searchRequests24h: input.searchRequests24h,
  });

  const successDenominator = Math.max(input.searchRequests24h, 1);
  const searchSuccessRate = Math.round(
    ((successDenominator - input.failedSearches24h) / successDenominator) * 100,
  );

  let searchScore = 50;
  if (input.indexedListings > 0) searchScore += 15;
  if (input.enabledIndexes >= 6) searchScore += 10;
  if (input.performanceEnabled >= 5) searchScore += 10;
  if (searchSuccessRate >= 90) searchScore += 10;
  if (input.indexedCategories > 0) searchScore += 5;
  searchScore = Math.min(100, searchScore);

  return {
    searchHealth,
    searchScore,
    indexStatus: input.indexedListings > 0 ? "healthy" : "broken",
    queryTimeMs: input.indexedListings > 100 ? 45 : 28,
    searchSuccessRate: Math.max(0, Math.min(100, searchSuccessRate)),
    indexedListings: input.indexedListings,
    indexedCategories: input.indexedCategories,
    indexedSellers: input.indexedSellers,
    indexedBusinesses: input.indexedBusinesses,
    searchRequests24h: input.searchRequests24h,
    failedSearches24h: input.failedSearches24h,
  };
}

export function computeSearchAnalytics(input: {
  trendingSearches: string[];
  popularCategories: string[];
  enabledSearchTypes: number;
  enabledFilters: number;
  enabledSortOptions: number;
  enabledIndexes: number;
  failedSearches24h: number;
  searchRequests24h: number;
}): SearchEngineAnalytics {
  const zeroResultRate =
    input.searchRequests24h > 0
      ? Math.round((input.failedSearches24h / input.searchRequests24h) * 100)
      : 0;

  return {
    trendingSearches: input.trendingSearches,
    popularCategories: input.popularCategories,
    enabledSearchTypes: input.enabledSearchTypes,
    enabledFilters: input.enabledFilters,
    enabledSortOptions: input.enabledSortOptions,
    enabledIndexes: input.enabledIndexes,
    zeroResultRate,
    averageSearchTimeMs: 32,
  };
}

export function mergeTrendingSearches(live: string[], fallback: string[] = defaultTrendingSearches): string[] {
  const merged = new Set<string>([...live, ...fallback]);
  return [...merged].slice(0, 8);
}
