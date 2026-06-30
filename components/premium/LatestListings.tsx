"use client";

import type { Product } from "@/lib/products/types";
import { ListingCarouselSection } from "@/components/premium/ListingCarouselSection";
import { PREMIUM_VIEW_ALL } from "@/components/premium/constants";

type LatestListingsProps = {
  products: Product[];
};

export function LatestListings({ products }: LatestListingsProps) {
  return (
    <ListingCarouselSection
      id="latest-listings"
      title="Latest Listings"
      subtitle="Fresh picks"
      products={products}
      viewAllHref={PREMIUM_VIEW_ALL.latestListings}
    />
  );
}
