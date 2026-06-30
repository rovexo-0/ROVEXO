"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type RecommendedListingsProps = {
  products: Product[];
};

export function RecommendedListings({ products }: RecommendedListingsProps) {
  return (
    <ListingCarouselSection
      id="recommended-listings"
      title="Recommended"
      subtitle="For you"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.recommended}
    />
  );
}
