import type { Product } from "@/lib/products/types";

export type ShowcaseSellerSection = {
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
  sellerAvatar: string | null;
  sellerVerified: boolean;
  sellerTier?: string;
  rating: number;
  reviewCount: number;
  followerCount?: number;
  listings: Product[];
  profileHref: string;
};

function resolveShowcaseProfileHref(product: Product): string {
  if (product.sellerUsername) {
    if (product.sellerRole === "business") {
      return `/store/${product.sellerUsername}`;
    }
    return `/user/${product.sellerUsername}`;
  }
  if (product.sellerId) {
    return `/search?seller=${encodeURIComponent(product.sellerId)}`;
  }
  return "/";
}

function sortListingsNewestFirst(listings: Product[]): Product[] {
  return [...listings].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function buildShowcaseSellerSections(
  products: Product[],
  options?: {
    maxSellers?: number;
    featuredSellerIds?: Set<string>;
  },
): ShowcaseSellerSection[] {
  const maxSellers = options?.maxSellers ?? 6;
  const featuredSellerIds =
    options?.featuredSellerIds ??
    new Set(
      products
        .filter((product) => product.isFeatured && product.sellerId)
        .map((product) => product.sellerId as string),
    );

  if (featuredSellerIds.size === 0) {
    return [];
  }

  const bySeller = new Map<string, Product[]>();

  for (const product of products) {
    const sellerId = product.sellerId;
    if (!sellerId || !featuredSellerIds.has(sellerId)) continue;
    const bucket = bySeller.get(sellerId) ?? [];
    bucket.push(product);
    bySeller.set(sellerId, bucket);
  }

  const sections: ShowcaseSellerSection[] = [];

  for (const [sellerId, listings] of bySeller) {
    const sorted = sortListingsNewestFirst(listings);
    const primary = sorted[0];
    if (!primary) continue;

    sections.push({
      sellerId,
      sellerName: primary.sellerName,
      sellerUsername: primary.sellerUsername ?? null,
      sellerAvatar: primary.sellerAvatar ?? null,
      sellerVerified: Boolean(primary.sellerVerified),
      sellerTier: primary.sellerTier,
      rating: primary.rating,
      reviewCount: primary.reviewCount,
      listings: sorted,
      profileHref: resolveShowcaseProfileHref(primary),
    });
  }

  return sections
    .sort((a, b) => {
      const ratingDelta = b.rating - a.rating;
      if (ratingDelta !== 0) return ratingDelta;
      return b.listings.length - a.listings.length;
    })
    .slice(0, maxSellers);
}

export async function enrichShowcaseSellerSections(
  sections: ShowcaseSellerSection[],
): Promise<ShowcaseSellerSection[]> {
  if (sections.length === 0) return sections;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const sellerIds = sections.map((section) => section.sellerId);

  const { data } = await admin
    .from("seller_profiles")
    .select("id, rating, review_count, follower_count")
    .in("id", sellerIds);

  const profileById = new Map(
    (data ?? []).map((row) => [
      row.id,
      {
        rating: Number(row.rating ?? 0),
        reviewCount: row.review_count ?? 0,
        followerCount: row.follower_count ?? 0,
      },
    ]),
  );

  return sections.map((section) => {
    const profile = profileById.get(section.sellerId);
    if (!profile) return section;
    return {
      ...section,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      followerCount: profile.followerCount,
    };
  });
}
