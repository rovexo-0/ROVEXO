"use client";

import type { Product } from "@/lib/products/types";
import { RovexoListingCarouselSection } from "@/components/home/RovexoListingCarouselSection";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";

type RovexoNewListingsProps = {
  products: Product[];
};

export function RovexoNewListings({ products }: RovexoNewListingsProps) {
  return (
    <RovexoListingCarouselSection
      id="new-listings"
      title="New Listings"
      products={products}
      viewAllHref={ROVEXO_VIEW_ALL.newListings}
    />
  );
}
