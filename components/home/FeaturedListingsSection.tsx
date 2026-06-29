"use client";

import { memo } from "react";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import type { Product } from "@/lib/products/types";

type FeaturedListingsSectionProps = {
  products: Product[];
  loading?: boolean;
  error?: boolean;
};

export const FeaturedListingsSection = memo(function FeaturedListingsSection({
  products,
  loading = false,
  error = false,
}: FeaturedListingsSectionProps) {
  return (
    <HomeProductSection
      id="featured-listings-heading"
      title="Featured Listings"
      products={products}
      loading={loading}
      error={error}
      layout="featured-grid"
      skeletonCount={10}
      hideWhenEmpty={false}
      viewAllHref="/search?q=&sort=popular"
    />
  );
});
