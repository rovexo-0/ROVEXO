"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type FeaturedListingsProps = {
  products: Product[];
};

export function FeaturedListings({ products }: FeaturedListingsProps) {
  return (
    <ListingCarouselSection
      id="featured-listings"
      title="Featured Listings"
      subtitle="Curated"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.featured}
      variant="featured"
    />
  );
}
