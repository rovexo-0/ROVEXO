"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type TrendingListingsProps = {
  products: Product[];
};

export function TrendingListings({ products }: TrendingListingsProps) {
  return (
    <ListingCarouselSection
      id="trending-listings"
      title="Trending"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.trending}
    />
  );
}
