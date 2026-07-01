"use client";

import type { Product } from "@/lib/products/types";
import { RovexoListingCarouselSection } from "@/components/home/RovexoListingCarouselSection";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";

type RovexoBoostListingsProps = {
  products: Product[];
};

export function RovexoBoostListings({ products }: RovexoBoostListingsProps) {
  return (
    <RovexoListingCarouselSection
      id="boost-listings"
      title="Boost Listings"
      products={products}
      viewAllHref={ROVEXO_VIEW_ALL.deals}
    />
  );
}
