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

export function buildShowcaseSellerSections(
  products: Product[],
  options?: { maxSellers?: number; maxListingsPerSeller?: number },
): ShowcaseSellerSection[] {
  const maxSellers = options?.maxSellers ?? 6;
  const maxListingsPerSeller = options?.maxListingsPerSeller ?? 12;
  const featured = products.filter((product) => product.isFeatured && product.sellerId);
  const bySeller = new Map<string, Product[]>();

  for (const product of featured) {
    const sellerId = product.sellerId!;
    const bucket = bySeller.get(sellerId) ?? [];
    bucket.push(product);
    bySeller.set(sellerId, bucket);
  }

  const sections: ShowcaseSellerSection[] = [];

  for (const [sellerId, listings] of bySeller) {
    const sorted = [...listings].sort(
      (a, b) => (b.homepagePriorityScore ?? 0) - (a.homepagePriorityScore ?? 0),
    );
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
      listings: sorted.slice(0, maxListingsPerSeller),
      profileHref: primary.sellerUsername
        ? `/user/${primary.sellerUsername}`
        : `/search?seller=${encodeURIComponent(sellerId)}`,
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
