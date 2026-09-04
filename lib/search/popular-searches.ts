import { createPublicCatalogueClient } from "@/lib/supabase/public-catalogue-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { applyHolidayModeVisibilityFilter } from "@/lib/listings/holiday-mode-visibility-v1";
import { withSearchCache } from "@/lib/search/cache";

type PopularTermRow = {
  title: string;
  seller_id: string | null;
  brands: { name: string } | { name: string }[] | null;
};

function toSearchTerm(title: string, brand?: string | null): string | null {
  const candidate = brand?.trim() || title.trim().split(/\s+/).slice(0, 3).join(" ");
  if (!candidate || candidate.length < 2) return null;
  return candidate;
}

function brandName(brands: PopularTermRow["brands"]): string | null {
  if (!brands) return null;
  if (Array.isArray(brands)) return brands[0]?.name?.trim() || null;
  return brands.name?.trim() || null;
}

/**
 * Popular search terms from live listings.
 * Slim title/brand query only — must not load full product cards, images,
 * trust, ratings, or transaction modes just to derive 8 strings.
 */
async function loadPopularSearches(limit: number): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const started = performance.now();
  const supabase = createPublicCatalogueClient();
  const scanLimit = Math.min(48, Math.max(limit * 4, 24));

  const { data, error } = await supabase
    .from("products")
    .select("title, seller_id, brands ( name )")
    .eq("status", "published")
    .eq("is_demo", false)
    .gt("stock", 0)
    .order("views", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(scanLimit);

  if (error) throw error;

  const visible = await applyHolidayModeVisibilityFilter(
    supabase,
    (data as PopularTermRow[] | null) ?? [],
  );

  const terms = new Set<string>();
  for (const row of visible) {
    const term = toSearchTerm(row.title, brandName(row.brands));
    if (term) terms.add(term);
    if (terms.size >= limit) break;
  }

  const ms = Math.round(performance.now() - started);
  console.info(
    "[SEARCH_PERF]",
    JSON.stringify({ op: "popular-terms", ms, rows: visible.length, terms: terms.size }),
  );

  return [...terms];
}

/** Automatic popular terms from marketplace listings — never admin-edited. */
export async function getPopularSearches(limit = 8): Promise<string[]> {
  return withSearchCache(
    "popular",
    `limit:${limit}`,
    () => loadPopularSearches(limit),
    { ttlMs: 60_000, emptyOnError: [] },
  );
}
