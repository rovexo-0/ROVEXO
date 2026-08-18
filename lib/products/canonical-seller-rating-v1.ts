/**
 * Canonical seller rating BIND for marketplace listing cards.
 *
 * Source of truth (read-only — do not recalculate):
 *   seller_profiles.rating
 *   seller_profiles.review_count
 *
 * ListingCard already renders `product.rating`. This helper replaces
 * `products.rating` with the listing seller's current seller_profiles values.
 *
 * Not a rating engine. Not a reviews engine. No aggregation. No cache.
 */

export const CANONICAL_SELLER_RATING_SOURCE = "seller_profiles" as const;

export type CanonicalSellerRating = {
  rating: number;
  reviewCount: number;
};

export type SellerRatingBindable = {
  sellerId?: string | null;
  rating: number;
  reviewCount: number;
};

export function collectSellerIdsForRatingBind(
  products: ReadonlyArray<{ sellerId?: string | null }>,
): string[] {
  return [
    ...new Set(
      products
        .map((product) => product.sellerId?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

export function mapSellerProfileRowsToRatings(
  rows: ReadonlyArray<{ id: string; rating: unknown; review_count: unknown }>,
): Map<string, CanonicalSellerRating> {
  const ratings = new Map<string, CanonicalSellerRating>();
  for (const row of rows) {
    ratings.set(String(row.id), {
      rating: Number(row.rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
    });
  }
  return ratings;
}

/**
 * Bind listing-card rating fields to canonical seller_profiles values.
 * Missing seller id or missing profile → 0.0 / 0 (never keep products.rating).
 */
export function applyCanonicalSellerRatingsToProducts<T extends SellerRatingBindable>(
  products: readonly T[],
  ratings: ReadonlyMap<string, CanonicalSellerRating>,
): T[] {
  return products.map((product) => {
    const sellerId = product.sellerId?.trim();
    if (!sellerId) {
      return { ...product, rating: 0, reviewCount: 0 };
    }
    const canonical = ratings.get(sellerId);
    if (!canonical) {
      return { ...product, rating: 0, reviewCount: 0 };
    }
    return {
      ...product,
      rating: canonical.rating,
      reviewCount: canonical.reviewCount,
    };
  });
}

export async function loadCanonicalSellerRatings(
  sellerIds: readonly string[],
): Promise<Map<string, CanonicalSellerRating>> {
  const unique = [...new Set(sellerIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return new Map();
  }

  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  if (admin) {
    const { data } = await admin
      .from("seller_profiles")
      .select("id, rating, review_count")
      .in("id", unique);
    return mapSellerProfileRowsToRatings(data ?? []);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select("id, rating, review_count")
    .in("id", unique);
  return mapSellerProfileRowsToRatings(data ?? []);
}

export async function enrichProductsWithCanonicalSellerRating<T extends SellerRatingBindable>(
  products: readonly T[],
): Promise<T[]> {
  if (products.length === 0) {
    return [];
  }
  const sellerIds = collectSellerIdsForRatingBind(products);
  const ratings = await loadCanonicalSellerRatings(sellerIds);
  return applyCanonicalSellerRatingsToProducts(products, ratings);
}
