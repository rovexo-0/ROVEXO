/**
 * Homepage-only exclusion of Full Demo certification listing slugs.
 * No QA fixture import. Identity is slug prefix only.
 */

export const HOMEPAGE_TEST_LISTING_EXCLUSION_V1 = {
  id: "homepage-test-listing-exclusion-v1",
  surfaces: ["homepage-feed", "homepage-showcase"] as const,
  productionWrites: 0,
  dbMutations: 0,
} as const;

export const HOMEPAGE_EXCLUDED_TEST_SLUG_PREFIXES = [
  "marketplace-refund-item-",
  "marketplace-cancel-session-",
] as const;

export type HomepageTestListingIdentity = {
  id?: string | null;
  slug?: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isHomepageExcludedTestListing(input: HomepageTestListingIdentity): boolean {
  const slug = normalize(input.slug);
  if (!slug) return false;
  return HOMEPAGE_EXCLUDED_TEST_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
}

export function excludeHomepageTestListings<T extends HomepageTestListingIdentity>(items: T[]): T[] {
  return items.filter((item) => !isHomepageExcludedTestListing(item));
}
