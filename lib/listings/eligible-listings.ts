import { unstable_cache } from "next/cache";
import { searchListings } from "@/lib/listings/repository";
import type {
  EligibleListingsOptions,
  SearchListingsOptions,
  SearchListingsResult,
} from "@/lib/listings/types";
import type { Product } from "@/lib/products/types";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";

export { resolveEligibleVisibleTotal } from "@/lib/listings/resolve-eligible-visible-total";

/**
 * ROVEXO canonical marketplace listings resolver — SINGLE SOURCE OF TRUTH.
 *
 * Every public surface (Homepage, Search, Category, Seller store, Similar,
 * Recommended, Featured, Recent) MUST resolve its listings through this
 * function. It guarantees identical visibility rules everywhere by:
 *  1. querying only `status = 'published'` products,
 *  2. hiding sellers with Holiday Mode ON (`user_settings.vacation_mode`)
 *     without mass-editing listing rows, and
 *  3. running each row through the canonical `HomepageEligibility` gate
 *     (verified seller, valid image, approved moderation, valid content, etc.)
 *     — implemented inside `searchListings` via `filterEligibleRows`.
 *
 * ROVEXO v1.0 — real products only. Empty result stays empty.
 * Never inject demo / mock / placeholder catalogue listings.
 *
 * There must be NO other place that decides whether a listing is publicly
 * visible. If a listing passes here, it is visible on every surface.
 */
export async function getEligibleListings(
  options: EligibleListingsOptions = {},
): Promise<SearchListingsResult> {
  const searchOptions: SearchListingsOptions = { ...options };
  delete (searchOptions as EligibleListingsOptions).surface;

  // New Listing Priority Freeze: seller / store surfaces always newest-first.
  if (options.surface === "seller" && searchOptions.sort == null) {
    searchOptions.sort = "newest";
  }

  const result = await searchListings(searchOptions);
  return {
    ...result,
    items: toPublicProductDocuments(result.items),
  };
}

/** Convenience: eligible listings as a plain array (Similar, Seller store, etc.). */
export async function getEligibleListingItems(
  options: EligibleListingsOptions = {},
): Promise<Product[]> {
  const result = await getEligibleListings(options);
  return result.items;
}

/**
 * Exact eligible total for a query — same visibility pipeline as the Listing Grid.
 * When the DB match set fits in one fetch, total equals visible item count.
 */
export async function countEligibleListings(
  options: EligibleListingsOptions = {},
): Promise<number> {
  // One first-page fetch large enough for typical root categories.
  // Avoids the historical probe(pageSize=1) + full(dbTotal) waterfall that
  // doubled Browse category-counter latency (Owner ~2.7s).
  const INITIAL_PAGE_SIZE = 48;
  const first = await getEligibleListings({
    ...options,
    page: 1,
    pageSize: INITIAL_PAGE_SIZE,
  });
  if (first.total <= 0) return 0;
  // resolveEligibleVisibleTotal already made `total` eligibility-exact when the
  // first page covered the entire DB match set.
  if (first.total <= INITIAL_PAGE_SIZE) return first.total;

  const full = await getEligibleListings({
    ...options,
    page: 1,
    pageSize: first.total,
  });
  return full.items.length;
}

/** Same category scope options used by `/category/[...slug]` Listing Grid. */
export function buildCategoryEligibleListingsOptions(input: {
  slugPath: string[];
  categoryIds: string[];
  page?: number;
  pageSize?: number;
}): EligibleListingsOptions {
  const hasIds = input.categoryIds.length > 0;
  return {
    surface: "category",
    categoryIds: hasIds ? input.categoryIds : undefined,
    categorySlugPath: hasIds ? undefined : input.slugPath,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 24,
  };
}

const BROWSE_COUNT_SELECT = `
  slug,
  title,
  description,
  status,
  price,
  category_id,
  moderation_status,
  seller_id,
  stock,
  is_demo,
  profiles!products_seller_id_fkey ( email, username, verified, account_status, role ),
  product_images ( url, thumbnail_url )
`;

type BrowseCountRow = {
  slug: string;
  title: string;
  description: string | null;
  status: string;
  price: number | string;
  category_id: string | null;
  moderation_status: string | null;
  seller_id?: string | null;
  stock?: number | null;
  is_demo?: boolean | null;
  profiles?: {
    email?: string | null;
    username?: string | null;
    verified?: boolean | null;
    account_status?: string | null;
    role?: string | null;
  } | null;
  product_images?: Array<{ url?: string | null; thumbnail_url?: string | null }> | null;
};

async function createBrowseCountClient() {
  try {
    const { createPublicCatalogueClient } = await import(
      "@/lib/supabase/public-catalogue-client"
    );
    return createPublicCatalogueClient();
  } catch {
    const { createClient } = await import("@/lib/supabase/server");
    return createClient();
  }
}

/**
 * One slim published-product scan for Browse counters.
 * Same visibility filters as `searchListings` (published, !demo, stock>0,
 * HomepageEligibility) — not ten full listing-search pipelines.
 */
async function fetchSlimPublishedRowsForBrowseCounts(): Promise<BrowseCountRow[]> {
  const supabase = await createBrowseCountClient();
  const pageSize = 1000;
  const rows: BrowseCountRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select(BROWSE_COUNT_SELECT)
      .eq("status", "published")
      .eq("is_demo", false)
      .gt("stock", 0)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const batch = (data as BrowseCountRow[] | null) ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

type BrowseRootScope = {
  slug: string;
  isActive: boolean;
  categoryIds: string[];
};

/**
 * One public categories read for all 10 roots.
 * Same descendant-id + is_active semantics as `resolveCategoryPage([root.slug])`,
 * without 10× cookie `loadAllCategories()` waterfalls.
 */
async function resolveCanonicalRootCategoryScopes(): Promise<BrowseRootScope[]> {
  const { CANONICAL_ROOT_CATEGORIES } = await import(
    "@/lib/categories/canonical-root-categories-v1"
  );
  const { findNodeBySlugPath } = await import("@/lib/categories/navigation");
  const { categoryTree } = await import("@/lib/categories/tree");

  const supabase = await createBrowseCountClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, parent_id, is_active")
    .order("sort_order", { ascending: true });
  const rows = (data as Array<{
    id: string;
    slug: string;
    parent_id: string | null;
    is_active: boolean | null;
  }> | null) ?? [];

  return CANONICAL_ROOT_CATEGORIES.map((root) => {
    const path = findNodeBySlugPath(categoryTree, [root.slug]);
    if (!path?.length) {
      return { slug: root.slug, isActive: false, categoryIds: [] };
    }

    const dbRoot = rows.find((row) => row.slug === root.slug && row.parent_id == null);
    if (!dbRoot) {
      return { slug: root.slug, isActive: true, categoryIds: [] };
    }

    const ids = new Set<string>([dbRoot.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of rows) {
        if (row.parent_id && ids.has(row.parent_id) && !ids.has(row.id)) {
          ids.add(row.id);
          changed = true;
        }
      }
    }

    return {
      slug: root.slug,
      isActive: dbRoot.is_active ?? true,
      categoryIds: [...ids],
    };
  });
}

async function computeCanonicalBrowseCategoryCounts(): Promise<
  Array<{ slug: string; itemCount: number }>
> {
  const { HomepageEligibility } = await import("@/lib/homepage/homepage-eligibility");

  const [scopes, rows] = await Promise.all([
    resolveCanonicalRootCategoryScopes(),
    fetchSlimPublishedRowsForBrowseCounts(),
  ]);

  const eligible = HomepageEligibility.filterEligibleRows(rows);

  return Promise.all(
    scopes.map(async (scope) => {
      if (!scope.isActive) {
        return { slug: scope.slug, itemCount: 0 };
      }

      if (scope.categoryIds.length === 0) {
        const itemCount = await countEligibleListings(
          buildCategoryEligibleListingsOptions({
            slugPath: [scope.slug],
            categoryIds: scope.categoryIds,
          }),
        );
        return { slug: scope.slug, itemCount };
      }

      const ids = new Set(scope.categoryIds);
      const itemCount = eligible.filter(
        (row) => row.category_id != null && ids.has(row.category_id),
      ).length;
      return { slug: scope.slug, itemCount };
    }),
  );
}

/**
 * Browse Categories counters — ONE SSOT with `/category/[slug]` grid.
 * Eligibility remains HomepageEligibility + published/!demo/stock>0.
 * Cached 300s to match `/browse` `revalidate` — same displayed rules, not a new count.
 */
export const getCanonicalBrowseCategoryCounts = unstable_cache(
  computeCanonicalBrowseCategoryCounts,
  ["canonical-browse-category-counts-v1"],
  { revalidate: 300 },
);
