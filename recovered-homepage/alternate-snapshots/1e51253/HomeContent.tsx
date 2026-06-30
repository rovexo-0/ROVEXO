"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { Product } from "@/lib/products/types";
import type { AuctionListing } from "@/lib/auctions/types";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { HeaderCategoryBar } from "@/components/header/HeaderCategoryBar";
import { VisualSection } from "@/components/platform-visual/VisualSection";
import { VisualThemeScope } from "@/components/platform-visual/VisualThemeScope";
import type { HomepageBuilderComponent, PlatformVisualConfig } from "@/lib/platform-visual/types";
import { cn } from "@/lib/cn";

const BringYourItemsBanner = dynamic(
  () =>
    import("@/components/home/BringYourItemsBanner").then((module) => ({
      default: module.BringYourItemsBanner,
    })),
  { loading: () => null },
);

const LiveAuctionsSection = dynamic(
  () =>
    import("@/components/home/LiveAuctionsSection").then((module) => ({
      default: module.LiveAuctionsSection,
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

const TrendingSearchesSection = dynamic(
  () =>
    import("@/components/home/TrendingSearchesSection").then((module) => ({
      default: module.TrendingSearchesSection,
    })),
  { loading: () => null },
);

type HomeContentProps = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  latestListings: Product[];
  liveAuctions: AuctionListing[];
  visualConfig: PlatformVisualConfig;
  loadError?: {
    featured?: boolean;
    recommended?: boolean;
    newListings?: boolean;
    latestListings?: boolean;
    auctions?: boolean;
  };
};

function renderHomeSection(
  component: HomepageBuilderComponent,
  props: Omit<HomeContentProps, "visualConfig">,
) {
  switch (component.id) {
    case "top-category-bar":
      return (
        <VisualSection key={component.id} component={component} className="rx-top-category-bar-section">
          <HeaderCategoryBar className="border-t-0" />
        </VisualSection>
      );
    case "category-rail":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeCategoryRail iconSize={component.style.iconSize ?? 80} gap={component.style.gap} />
        </VisualSection>
      );
    case "bring-items":
      return (
        <VisualSection key={component.id} component={component}>
          <BringYourItemsBanner />
        </VisualSection>
      );
    case "popular-auctions":
      return (
        <VisualSection key={component.id} component={component}>
          <LiveAuctionsSection auctions={props.liveAuctions} loadError={props.loadError?.auctions} />
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
            title="Recommended"
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
    case "new-listings":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeProductSection
            id="new-listings-heading"
            title="New Listings"
            products={props.newListings}
            error={props.loadError?.newListings}
            hideWhenEmpty={false}
            viewAllHref="/search?q=&sort=newest"
            viewAllLabel="View all →"
            layout="scroll-grid"
            skeletonCount={component.style.columns ?? 4}
          />
        </VisualSection>
      );
    case "latest-listings":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeProductSection
            id="latest-listings-heading"
            title="Latest Listings"
            products={props.latestListings}
            error={props.loadError?.latestListings}
            hideWhenEmpty={false}
            viewAllHref="/search?q=&sort=trending"
            viewAllLabel="View all →"
            layout="scroll-grid"
            skeletonCount={component.style.columns ?? 4}
          />
        </VisualSection>
      );
    case "continue-browsing":
      return (
        <VisualSection key={component.id} component={component}>
          <HomeContinueBrowsingCarousel />
        </VisualSection>
      );
    case "trending-searches":
      return (
        <VisualSection key={component.id} component={component}>
          <TrendingSearchesSection />
        </VisualSection>
      );
    default:
      return null;
  }
}

export const HomeContent = memo(function HomeContent({
  featured,
  recommended,
  newListings,
  latestListings,
  liveAuctions,
  visualConfig,
  loadError = {},
}: HomeContentProps) {
  const sectionProps = {
    featured,
    recommended,
    newListings,
    latestListings,
    liveAuctions,
    loadError,
  };

  return (
    <VisualThemeScope theme={visualConfig.theme} mode={visualConfig.mode}>
      <main
        className={cn(
          "rx-home-polish rx-home-final flex w-full flex-col pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))]",
        )}
      >
        {visualConfig.publishedSections.map((component) => renderHomeSection(component, sectionProps))}
      </main>
    </VisualThemeScope>
  );
});
