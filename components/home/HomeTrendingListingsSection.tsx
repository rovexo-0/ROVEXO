"use client";

import { memo } from "react";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import { HOME_LAUNCH_VIEW_ALL_HREFS } from "@/components/home/home-launch-config";
import type { Product } from "@/lib/products/types";

type HomeTrendingListingsSectionProps = {
  products: Product[];
  error?: boolean;
};

export const HomeTrendingListingsSection = memo(function HomeTrendingListingsSection({
  products,
  error = false,
}: HomeTrendingListingsSectionProps) {
  return (
    <HomeProductSection
      id="trending-listings-heading"
      title="Trending"
      products={products}
      error={error}
      hideWhenEmpty
      viewAllHref={HOME_LAUNCH_VIEW_ALL_HREFS.trending}
    />
  );
});
