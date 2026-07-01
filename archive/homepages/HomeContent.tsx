"use client";

import { memo } from "react";
import type { Product } from "@/lib/products/types";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { AuctionsSection } from "@/components/home/AuctionsSection";
import { StoreMigrationHeroBanner } from "@/features/seller/migration/components/StoreMigrationHeroBanner";
import { cn } from "@/lib/cn";

type HomeContentProps = {
  featured: Product[];
  loadError?: boolean;
};

export const HomeContent = memo(function HomeContent({
  featured,
  loadError = false,
}: HomeContentProps) {
  return (
    <main className={cn("rx-home-polish rx-home-final flex flex-col pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-7xl lg:w-full")}>
      <HomeCategoryRail />

      <StoreMigrationHeroBanner />

      <ProductCarouselSection
        id="featured-heading"
        title="Featured Listings"
        products={featured}
        error={loadError}
        hideWhenEmpty={false}
        viewAllHref="/search?q=&featured=1"
      />

      <AuctionsSection />
    </main>
  );
});
