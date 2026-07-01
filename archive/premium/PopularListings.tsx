"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type PopularListingsProps = {
  products: Product[];
};

export function PopularListings({ products }: PopularListingsProps) {
  return (
    <ListingCarouselSection
      id="popular-listings"
      title="Popular Listings"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.popular}
    />
  );
}
