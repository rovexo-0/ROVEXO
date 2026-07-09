import { createAdminClient } from "@/lib/supabase/admin";
import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { getPopularSearches } from "@/lib/search/popular-searches";
import { getStaticDiscoverySlugs, resolveDiscoveryPage } from "@/lib/seo/engine/discovery";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";

export type SearchInsight = {
  term: string;
  type: "product" | "brand" | "category" | "location";
  searchCount: number;
  inventoryCount: number;
  hasLowInventory: boolean;
  hasNoResults: boolean;
};

export type SearchInsightsReport = {
  generatedAt: string;
  mostSearchedProducts: SearchInsight[];
  mostSearchedBrands: SearchInsight[];
  mostSearchedCategories: SearchInsight[];
  mostSearchedLocations: SearchInsight[];
  lowInventorySearches: SearchInsight[];
  noResultSearches: SearchInsight[];
  recommendations: string[];
};

async function readRecentSearchQueries(limit = 50): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
    const { data } = await admin
      .from("platform_audit_logs")
      .select("metadata")
      .eq("action", "search.query")
      .gte("created_at", since)
      .limit(500);

    for (const row of data ?? []) {
      const metadata = row.metadata as { query?: string } | null;
      const query = metadata?.query?.trim().toLowerCase();
      if (!query || query.length < 2) continue;
      counts.set(query, (counts.get(query) ?? 0) + 1);
    }
  } catch {
    // Fallback handled below
  }
  return counts;
}

async function estimateInventoryForTerm(term: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .ilike("title", `%${term}%`);
    return count ?? 0;
  } catch {
    return 0;
  }
}

function buildInsight(term: string, type: SearchInsight["type"], searchCount: number, inventoryCount: number): SearchInsight {
  return {
    term,
    type,
    searchCount,
    inventoryCount,
    hasLowInventory: inventoryCount > 0 && inventoryCount < 3,
    hasNoResults: inventoryCount === 0,
  };
}

/** Search Insights Engine — analyzes internal marketplace searches deterministically. */
export async function buildSearchInsightsReport(): Promise<SearchInsightsReport> {
  const [queryCounts, popularSearches, trends] = await Promise.all([
    readRecentSearchQueries(),
    getPopularSearches(15).catch(() => [] as string[]),
    detectTrendSignals(20),
  ]);

  const terms = new Map<string, { count: number; type: SearchInsight["type"] }>();

  for (const [query, count] of queryCounts) {
    terms.set(query, { count, type: "product" });
  }
  for (const search of popularSearches) {
    const key = search.toLowerCase();
    const existing = terms.get(key);
    terms.set(key, { count: (existing?.count ?? 0) + 5, type: "product" });
  }
  for (const signal of trends) {
    const key = signal.label.toLowerCase();
    const type =
      signal.type === "brand"
        ? "brand"
        : signal.type === "category"
          ? "category"
          : signal.type === "location"
            ? "location"
            : "product";
    terms.set(key, { count: (terms.get(key)?.count ?? 0) + Math.round(signal.score / 10), type });
  }

  for (const alias of Object.keys(CATEGORY_ALIASES).slice(0, 10)) {
    const key = alias.replace(/-/g, " ");
    if (!terms.has(key)) {
      terms.set(key, { count: 2, type: "category" });
    }
  }

  const insights: SearchInsight[] = [];
  for (const [term, meta] of [...terms.entries()].slice(0, 30)) {
    const inventoryCount = await estimateInventoryForTerm(term);
    insights.push(buildInsight(term, meta.type, meta.count, inventoryCount));
  }

  insights.sort((a, b) => b.searchCount - a.searchCount);

  const mostSearchedProducts = insights.filter((entry) => entry.type === "product").slice(0, 10);
  const mostSearchedBrands = insights.filter((entry) => entry.type === "brand").slice(0, 10);
  const mostSearchedCategories = insights.filter((entry) => entry.type === "category").slice(0, 10);
  const mostSearchedLocations = insights
    .filter((entry) => entry.type === "location")
    .concat(
      ALL_UK_LOCATIONS.slice(0, 5).map((loc) =>
        buildInsight(loc.name, "location", 3, 0),
      ),
    )
    .slice(0, 10);

  const lowInventorySearches = insights.filter((entry) => entry.hasLowInventory);
  const noResultSearches = insights.filter((entry) => entry.hasNoResults);

  const recommendations: string[] = [];
  for (const entry of noResultSearches.slice(0, 5)) {
    recommendations.push(`Recruit sellers for "${entry.term}" — ${entry.searchCount} searches with zero inventory`);
  }
  for (const entry of lowInventorySearches.slice(0, 5)) {
    recommendations.push(`Promote "${entry.term}" category — high demand (${entry.searchCount} searches) but only ${entry.inventoryCount} listings`);
  }
  for (const slug of getStaticDiscoverySlugs().slice(0, 3)) {
    const page = resolveDiscoveryPage(slug);
    if (page) recommendations.push(`Discovery page active: ${page.path}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    mostSearchedProducts,
    mostSearchedBrands,
    mostSearchedCategories,
    mostSearchedLocations,
    lowInventorySearches,
    noResultSearches,
    recommendations,
  };
}
