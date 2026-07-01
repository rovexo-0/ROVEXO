"use client";

import type { Product } from "@/lib/products/types";
import { RovexoListingCarouselSection } from "@/components/home/RovexoListingCarouselSection";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";

type RovexoPremiumListingsProps = {
  products: Product[];
};

export function RovexoPremiumListings({ products }: RovexoPremiumListingsProps) {
  return (
    <RovexoListingCarouselSection
      id="premium-listings"
      title="Premium Listings"
      products={products}
      viewAllHref={ROVEXO_VIEW_ALL.featured}
    />
  );
}
