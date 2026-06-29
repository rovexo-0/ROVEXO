import { describe, expect, it } from "vitest";
import { createDefaultSearchEngineDocument } from "@/lib/search-engine/defaults";
import {
  SEARCH_ENGINE_INDEXES,
  SEARCH_ENGINE_MODULE_IDS,
  SEARCH_ENGINE_MODULES,
  SEARCH_ENGINE_SORT_OPTIONS,
  SEARCH_ENGINE_TYPES,
  registerSearchEngineModule,
} from "@/lib/search-engine/registry";
import {
  buildSearchDashboard,
  computeSearchAnalytics,
  countEnabledFlags,
  countEnabledItems,
  deriveSearchHealth,
  mergeTrendingSearches,
} from "@/lib/search-engine/timeline";

describe("search engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultSearchEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.modules.some((m) => m.id === "global" && m.enabled)).toBe(true);
    expect(doc.integrations.analyticsEngine).toBe(true);
    expect(doc.performance.instantResults).toBe(true);
    expect(doc.filters.category).toBe(true);
  });

  it("registers all core search modules", () => {
    const ids = SEARCH_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("global");
    expect(ids).toContain("listings");
    expect(ids).toContain("enterprise");
  });

  it("defines module ids, search types, sort options, and indexes", () => {
    expect(SEARCH_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("marketplace");
    expect(SEARCH_ENGINE_TYPES.map((t) => t.id)).toContain("autocomplete");
    expect(SEARCH_ENGINE_SORT_OPTIONS.map((s) => s.id)).toContain("best-match");
    expect(SEARCH_ENGINE_INDEXES.map((i) => i.id)).toContain("listings");
  });

  it("derives search health from index and activity signals", () => {
    expect(deriveSearchHealth({ indexedListings: 100, failedSearches24h: 0, searchRequests24h: 10 })).toBe("healthy");
    expect(deriveSearchHealth({ indexedListings: 0, failedSearches24h: 0, searchRequests24h: 0 })).toBe("broken");
    expect(deriveSearchHealth({ indexedListings: 100, failedSearches24h: 50, searchRequests24h: 100 })).toBe("degraded");
  });

  it("builds search dashboard", () => {
    const dashboard = buildSearchDashboard({
      indexedListings: 250,
      indexedCategories: 40,
      indexedSellers: 120,
      indexedBusinesses: 15,
      searchRequests24h: 100,
      failedSearches24h: 5,
      enabledIndexes: 8,
      performanceEnabled: 6,
    });
    expect(dashboard.searchScore).toBeGreaterThanOrEqual(70);
    expect(dashboard.indexStatus).toBe("healthy");
    expect(dashboard.indexedListings).toBe(250);
  });

  it("computes search analytics", () => {
    const doc = createDefaultSearchEngineDocument();
    const analytics = computeSearchAnalytics({
      trendingSearches: ["iPhone", "Cars"],
      popularCategories: ["Electronics", "Fashion"],
      enabledSearchTypes: countEnabledItems(doc.searchTypes),
      enabledFilters: countEnabledFlags(doc.filters),
      enabledSortOptions: countEnabledItems(doc.sortOptions),
      enabledIndexes: countEnabledItems(doc.indexes),
      failedSearches24h: 2,
      searchRequests24h: 50,
    });
    expect(analytics.trendingSearches).toHaveLength(2);
    expect(analytics.enabledFilters).toBeGreaterThan(0);
    expect(analytics.zeroResultRate).toBe(4);
  });

  it("merges trending searches with fallback", () => {
    const merged = mergeTrendingSearches(["Custom"], ["Cars", "iPhone"]);
    expect(merged).toContain("Custom");
    expect(merged).toContain("Cars");
  });

  it("allows future module registration", () => {
    const next = registerSearchEngineModule({
      id: "custom-search",
      label: "Custom Search",
      icon: "🔍",
      description: "Future module",
      href: "/search",
    });
    expect(next.some((m) => m.id === "custom-search")).toBe(true);
  });
});
