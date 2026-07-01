"use client";

import type { Product } from "@/lib/products/types";
import { RovexoListingCarouselSection } from "@/components/home/RovexoListingCarouselSection";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";

type RovexoFeaturedListingsProps = {
  products: Product[];
};

export function RovexoFeaturedListings({ products }: RovexoFeaturedListingsProps) {
  return (
    <RovexoListingCarouselSection
      id="featured-listings"
      title="Featured Listings"
      products={products}
      viewAllHref={ROVEXO_VIEW_ALL.featured}
    />
  );
}
