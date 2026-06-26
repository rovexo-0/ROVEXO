"use client";

import { memo } from "react";
import type { Product } from "@/lib/products/types";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { HomeHeroBanner } from "@/components/home/HomeHeroBanner";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { AuctionsSection } from "@/components/home/AuctionsSection";
import { StoreMigrationHeroBanner } from "@/features/seller/migration/components/StoreMigrationHeroBanner";
import { cn } from "@/lib/cn";
import "@/styles/home-premium-polish.css";

type HomeContentProps = {
  featured: Product[];
  recommended: Product[];
  newest: Product[];
  loadError?: boolean;
};

export const HomeContent = memo(function HomeContent({
  featured,
  recommended,
  newest,
  loadError = false,
}: HomeContentProps) {
  return (
    <main
      className={cn(
        "home-premium-polish flex flex-col gap-ds-2 pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-7xl lg:w-full",
      )}
    >
      <HomeHeroBanner />

      <HomeCategoryRail />

      <StoreMigrationHeroBanner />

      <ProductCarouselSection
        id="featured-heading"
        title="Featured Listings"
        products={featured}
        error={loadError}
        viewAllHref="/search?q=&featured=1"
      />

      <ProductCarouselSection
        id="recommended-heading"
        title="Recommended For You"
        products={recommended}
        error={loadError}
        viewAllHref="/search?q=&sort=trending"
      />

      <AuctionsSection />

      <ProductCarouselSection
        id="latest-heading"
        title="Latest Listings"
        products={newest}
        error={loadError}
        viewAllHref="/search?q=&sort=newest"
      />
    </main>
  );
});
