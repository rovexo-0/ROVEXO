import { searchListings } from "@/lib/listings/repository";
import type {
  EligibleListingsOptions,
  SearchListingsOptions,
  SearchListingsResult,
} from "@/lib/listings/types";
import type { Product } from "@/lib/products/types";

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

  return searchListings(searchOptions);
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

/**
 * Browse Categories counters — ONE SSOT with `/category/[slug]` grid.
 * Counts via `getEligibleListings` / `countEligibleListings` only.
 * Never uses raw published product tallies or legacy sector aggregation.
 */
export async function getCanonicalBrowseCategoryCounts(): Promise<
  Array<{ slug: string; itemCount: number }>
> {
  const { resolveCategoryPage } = await import("@/lib/categories/server");
  const { CANONICAL_ROOT_CATEGORIES } = await import(
    "@/lib/categories/canonical-root-categories-v1"
  );

  return Promise.all(
    CANONICAL_ROOT_CATEGORIES.map(async (root) => {
      const category = await resolveCategoryPage([root.slug]);
      if (!category || !category.isActive) {
        return { slug: root.slug, itemCount: 0 };
      }

      const itemCount = await countEligibleListings(
        buildCategoryEligibleListingsOptions({
          slugPath: [root.slug],
          categoryIds: category.categoryIds,
        }),
      );

      return { slug: root.slug, itemCount };
    }),
  );
}
