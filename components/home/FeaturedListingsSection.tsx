"use client";

import { memo } from "react";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import { HOME_LAUNCH_VIEW_ALL_HREFS } from "@/components/home/home-launch-config";
import type { Product } from "@/lib/products/types";

type FeaturedListingsSectionProps = {
  products: Product[];
  error?: boolean;
};

export const FeaturedListingsSection = memo(function FeaturedListingsSection({
  products,
  error = false,
}: FeaturedListingsSectionProps) {
  return (
    <HomeProductSection
      id="featured-listings-heading"
      title="Featured Listings"
      products={products}
      error={error}
      hideWhenEmpty
      viewAllHref={HOME_LAUNCH_VIEW_ALL_HREFS.featured}
    />
  );
});
