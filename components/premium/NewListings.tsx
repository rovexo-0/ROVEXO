"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type NewListingsProps = {
  products: Product[];
};

export function NewListings({ products }: NewListingsProps) {
  return (
    <ListingCarouselSection
      id="new-listings"
      title="New Listings"
      subtitle="Just arrived"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.newListings}
      variant="new"
    />
  );
}
