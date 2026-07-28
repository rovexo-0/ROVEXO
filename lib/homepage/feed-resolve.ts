import type { RovexoBusiness } from "@/components/home/constants";
import type { Product, ProductsPage } from "@/lib/products/types";
import {
  buildShowcaseSellerSections,
  type ShowcaseSellerSection,
} from "@/lib/homepage/showcase-sellers";
import {
  compareHomepageFeedProducts,
  computeHomepagePriorityScore,
} from "@/lib/homepage/feed-ranking";
import { filterHomepageProducts } from "@/lib/homepage/homepage-eligibility";

/**
 * ROVEXO v1.0 — real products only.
 * Homepage / search / showcase resolve DB-eligible inventory.
 * Never inject demo / mock / placeholder listings.
 */

function uniqueById(products: Product[]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const product of products) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
  }
  return result;
}

export function resolveShowcaseSections(
  fromDb: ShowcaseSellerSection[],
  feedItems: Product[],
): ShowcaseSellerSection[] {
  const cleanedDb = fromDb
    .map((section) => ({
      ...section,
      listings: filterHomepageProducts(section.listings),
    }))
    .filter((section) => section.listings.length > 0);
  if (cleanedDb.length > 0) return cleanedDb;

  return buildShowcaseSellerSections(filterHomepageProducts(feedItems));
}

export type HomepageEnrichedData = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  boostListings: Product[];
  premiumListings: Product[];
  businesses: RovexoBusiness[];
};

export function resolveHomepageFeedItems(feed: ProductsPage): ProductsPage {
  const filtered = filterHomepageProducts(feed.items);

  if (filtered.length === 0) {
    return { ...feed, items: [] };
  }

  return {
    ...feed,
    items: [...filtered]
      .map((product) => ({
        ...product,
        homepagePriorityScore: computeHomepagePriorityScore(product),
      }))
      .sort(compareHomepageFeedProducts),
  };
}

/** @deprecated Homepage v1.0 uses a single All Listings feed — use resolveHomepageFeedItems. */
export function enrichHomepageData(input: {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  popularListings: Product[];
}): HomepageEnrichedData {
  const pool = uniqueById([
    ...input.featured,
    ...input.recommended,
    ...input.newListings,
    ...input.popularListings,
  ]);

  const businessesFromProducts = pool
    .filter((product) => product.sellerTier === "business" || product.listingType === "business")
    .map((product) => ({
      id: product.sellerId ?? product.id,
      name: product.sellerName,
      slug: product.slug,
      logoUrl: product.sellerAvatar || product.imageUrl,
      verified: Boolean(product.sellerVerified),
      category: product.brand ?? "Marketplace",
      listingCount: pool.length,
      href: product.sellerId
        ? `/search?seller=${encodeURIComponent(product.sellerId)}`
        : "/search",
    }));

  return {
    featured: uniqueById(input.featured),
    recommended: uniqueById(input.recommended),
    newListings: uniqueById(input.newListings),
    boostListings: uniqueById(pool.filter((product) => product.isBumped)),
    premiumListings: uniqueById(
      pool.filter(
        (product) => product.sellerTier === "premium" || product.listingType === "premium",
      ),
    ),
    businesses: businessesFromProducts,
  };
}
