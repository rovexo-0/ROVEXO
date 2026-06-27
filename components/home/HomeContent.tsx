"use client";

import { memo, useCallback, type FocusEvent, type MouseEvent } from "react";
import type { BusinessDirectoryEntry } from "@/lib/business/directory";
import type { Product } from "@/lib/products/types";
import type { AuctionListing } from "@/lib/auctions/types";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { LiveAuctionsSection } from "@/components/home/LiveAuctionsSection";
import { BusinessSpotlightSection } from "@/components/home/BusinessSpotlightSection";
import { HomeContinueBrowsingCarousel } from "@/components/home/HomeRecentlyViewedCarousel";
import { HomeHeroBannerEngine } from "@/features/seller/migration/components/StoreMigrationHeroBanner";
import { HeroCategorySyncProvider, useHeroCategorySync } from "@/lib/home/hero-category-sync";
import { resolveCategoryKeyFromHref } from "@/lib/home/hero-slide-map";
import { cn } from "@/lib/cn";

type HomeContentProps = {
  recommended: Product[];
  recentlyListed: Product[];
  liveAuctions: AuctionListing[];
  businesses: BusinessDirectoryEntry[];
  loadError?: {
    recommended?: boolean;
    recentlyListed?: boolean;
    auctions?: boolean;
  };
};

const HomeCategoryRailSync = memo(function HomeCategoryRailSync() {
  const { setPreviewCategoryKey, clearPreviewCategoryKey } = useHeroCategorySync();

  const handleCategoryPreview = useCallback(
    (event: FocusEvent | MouseEvent) => {
      const card = (event.target as HTMLElement).closest("a.rx-category-card");
      if (!card) return;
      const categoryKey = resolveCategoryKeyFromHref(card.getAttribute("href"));
      if (categoryKey) setPreviewCategoryKey(categoryKey);
    },
    [setPreviewCategoryKey],
  );

  const handleCategoryPreviewEnd = useCallback(
    (event: MouseEvent) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && event.currentTarget.contains(nextTarget)) return;
      clearPreviewCategoryKey();
    },
    [clearPreviewCategoryKey],
  );

  return (
    <div
      className="rx-home-category-sync"
      onFocusCapture={handleCategoryPreview}
      onMouseOver={handleCategoryPreview}
      onMouseLeave={handleCategoryPreviewEnd}
    >
      <HomeCategoryRail />
    </div>
  );
});

export const HomeContent = memo(function HomeContent({
  recommended,
  recentlyListed,
  liveAuctions,
  businesses,
  loadError = {},
}: HomeContentProps) {
  return (
    <HeroCategorySyncProvider>
      <main
        className={cn(
          "rx-home-polish rx-home-final flex w-full flex-col pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))]",
        )}
      >
        <HomeCategoryRailSync />
        <HomeHeroBannerEngine />

        <ProductCarouselSection
          id="recommended-heading"
          title="Recommended"
          products={recommended}
          error={loadError.recommended}
          hideWhenEmpty={false}
          viewAllHref="/search?q=&sort=recommended"
        />

        <ProductCarouselSection
          id="recently-listed-heading"
          title="Recently Listed"
          products={recentlyListed}
          error={loadError.recentlyListed}
          hideWhenEmpty={false}
          viewAllHref="/search?q=&sort=newest"
        />

        <LiveAuctionsSection auctions={liveAuctions} loadError={loadError.auctions} />

        <BusinessSpotlightSection businesses={businesses} />

        <HomeContinueBrowsingCarousel />
      </main>
    </HeroCategorySyncProvider>
  );
});
