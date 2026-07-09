import { searchListings } from "@/lib/listings/repository";
import type {
  EligibleListingsOptions,
  SearchListingsOptions,
  SearchListingsResult,
} from "@/lib/listings/types";
import type { Product } from "@/lib/products/types";

/**
 * ROVEXO canonical marketplace listings resolver — SINGLE SOURCE OF TRUTH.
 *
 * Every public surface (Homepage, Search, Category, Seller store, Similar,
 * Recommended, Featured, Recent) MUST resolve its listings through this
 * function. It guarantees identical visibility rules everywhere by:
 *  1. querying only `status = 'published'` products, and
 *  2. running each row through the canonical `HomepageEligibility` gate
 *     (verified seller, valid image, approved moderation, valid content, etc.)
 *     — implemented inside `searchListings` via `filterEligibleRows`.
 *
 * There must be NO other place that decides whether a listing is publicly
 * visible. If a listing passes here, it is visible on every surface.
 */
export async function getEligibleListings(
  options: EligibleListingsOptions = {},
): Promise<SearchListingsResult> {
  const searchOptions: SearchListingsOptions = { ...options };
  delete (searchOptions as EligibleListingsOptions).surface;
  return searchListings(searchOptions);
}

/** Convenience: eligible listings as a plain array (Similar, Seller store, etc.). */
export async function getEligibleListingItems(
  options: EligibleListingsOptions = {},
): Promise<Product[]> {
  const result = await getEligibleListings(options);
  return result.items;
}
