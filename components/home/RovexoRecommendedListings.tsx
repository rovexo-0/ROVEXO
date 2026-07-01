"use client";

import type { Product } from "@/lib/products/types";
import { RovexoListingCarouselSection } from "@/components/home/RovexoListingCarouselSection";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";

type RovexoRecommendedListingsProps = {
  products: Product[];
};

export function RovexoRecommendedListings({ products }: RovexoRecommendedListingsProps) {
  return (
    <RovexoListingCarouselSection
      id="recommended-listings"
      title="Recommended"
      products={products}
      viewAllHref={ROVEXO_VIEW_ALL.recommended}
    />
  );
}
