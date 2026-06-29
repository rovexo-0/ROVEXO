"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, type FocusEvent, type MouseEvent } from "react";
import type { BusinessDirectoryEntry } from "@/lib/business/directory";
import type { Product } from "@/lib/products/types";
import type { AuctionListing } from "@/lib/auctions/types";
import type { HomeHeroBannerSlide } from "@/lib/home/constants";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { HomeHeroBannerEngine } from "@/features/seller/migration/components/StoreMigrationHeroBanner";
import { HeroCategorySyncProvider, useHeroCategorySync } from "@/lib/home/hero-category-sync";
import { resolveCategoryKeyFromHref } from "@/lib/home/hero-slide-map";
import { VisualSection } from "@/components/platform-visual/VisualSection";
import { VisualThemeScope } from "@/components/platform-visual/VisualThemeScope";
import type { HomepageBuilderComponent, PlatformVisualConfig } from "@/lib/platform-visual/types";
import { cn } from "@/lib/cn";

const LiveAuctionsSection = dynamic(
  () =>
    import("@/components/home/LiveAuctionsSection").then((module) => ({
      default: module.LiveAuctionsSection,
    })),
  { loading: () => null },
);

const BusinessSpotlightSection = dynamic(
  () =>
    import("@/components/home/BusinessSpotlightSection").then((module) => ({
      default: module.BusinessSpotlightSection,
    })),
  { loading: () => null },
);

const HomeContinueBrowsingCarousel = dynamic(
  () =>
    import("@/components/home/HomeRecentlyViewedCarousel").then((module) => ({
      default: module.HomeContinueBrowsingCarousel,
    })),
  { loading: () => null },
);

type HomeContentProps = {
  featured: Product[];
  recommended: Product[];
  recentlyListed: Product[];
  liveAuctions: AuctionListing[];
  businesses: BusinessDirectoryEntry[];
  visualConfig: PlatformVisualConfig;
  heroSlides: HomeHeroBannerSlide[];
  heroAutoAdvanceMs: number;
  loadError?: {
    featured?: boolean;
    recommended?: boolean;
    recentlyListed?: boolean;
    auctions?: boolean;
  };
};

const HomeCategoryRailSync = memo(function HomeCategoryRailSync({
  component,
}: {
  component: HomepageBuilderComponent;
}) {
  const { setPreviewCategoryKey, clearPreviewCategoryKey } = useHeroCategorySync();
  const iconSize = component.style.iconSize ?? 80;

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
    <VisualSection component={component}>
      <div
        className="rx-home-category-sync"
        onFocusCapture={handleCategoryPreview}
        onMouseOver={handleCategoryPreview}
        onMouseLeave={handleCategoryPreviewEnd}
      >
        <HomeCategoryRail iconSize={iconSize} gap={component.style.gap} />
      </div>
    </VisualSection>
  );
});

function renderHomeSection(
  component: HomepageBuilderComponent,
  props: Omit<HomeContentProps, "visualConfig" | "heroSlides" | "heroAutoAdvanceMs"> & {
    heroSlides: HomeHeroBannerSlide[];
    heroAutoAdvanceMs: number;
  },
) {
  switch (component.id) {
    case "category-rail":
      return <HomeCategoryRailSync key={component.id} component={component} />;
    case "hero-slider":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeHeroBannerEngine slides={props.heroSlides} autoAdvanceMs={props.heroAutoAdvanceMs} />
        </VisualSection>
      );
    case "featured-listings":
      return (
        <VisualSection key={component.id} component={component}>
          <FeaturedListingsSection products={props.featured} error={props.loadError?.featured} />
        </VisualSection>
      );
    case "recommended":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeProductSection
            id="recommended-for-you-heading"
            title="Recommended For You"
            products={props.recommended}
            error={props.loadError?.recommended}
            hideWhenEmpty={false}
            viewAllHref="/search?q=&sort=recommended"
            viewAllLabel="View all →"
            layout="scroll-grid"
            skeletonCount={component.style.columns ?? 4}
          />
        </VisualSection>
      );
    case "recently-listed":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeProductSection
            id="recently-listed-heading"
            title="Recently Listed"
            products={props.recentlyListed}
            error={props.loadError?.recentlyListed}
            hideWhenEmpty={false}
            viewAllHref="/search?q=&sort=newest"
            viewAllLabel="View all →"
            layout="scroll-grid"
            skeletonCount={component.style.columns ?? 4}
          />
        </VisualSection>
      );
    case "popular-auctions":
      return (
        <VisualSection key={component.id} component={component}>
          <LiveAuctionsSection auctions={props.liveAuctions} loadError={props.loadError?.auctions} />
        </VisualSection>
      );
    case "business-spotlight":
      return (
        <VisualSection key={component.id} component={component}>
          <BusinessSpotlightSection businesses={props.businesses} />
        </VisualSection>
      );
    case "continue-browsing":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeContinueBrowsingCarousel />
        </VisualSection>
      );
    default:
      return null;
  }
}

export const HomeContent = memo(function HomeContent({
  featured,
  recommended,
  recentlyListed,
  liveAuctions,
  businesses,
  visualConfig,
  heroSlides,
  heroAutoAdvanceMs,
  loadError = {},
}: HomeContentProps) {
  const sectionProps = {
    featured,
    recommended,
    recentlyListed,
    liveAuctions,
    businesses,
    heroSlides,
    heroAutoAdvanceMs,
    loadError,
  };

  return (
    <VisualThemeScope theme={visualConfig.theme} mode={visualConfig.mode}>
      <HeroCategorySyncProvider>
        <main
          className={cn(
            "rx-home-polish rx-home-final flex w-full flex-col pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))]",
          )}
        >
          {visualConfig.publishedSections.map((component) => renderHomeSection(component, sectionProps))}
        </main>
      </HeroCategorySyncProvider>
    </VisualThemeScope>
  );
});
