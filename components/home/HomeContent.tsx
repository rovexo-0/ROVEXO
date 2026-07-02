"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { Product } from "@/lib/products/types";
import type { AuctionListing } from "@/lib/auctions/types";
import type { ProductsPage } from "@/lib/products/types";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HomeProductSection } from "@/components/home/HomeProductSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { HomeAllListingsSection } from "@/components/home/HomeAllListingsSection";
import { HomeTrendingListingsSection } from "@/components/home/HomeTrendingListingsSection";
import { HOME_LAUNCH_VIEW_ALL_HREFS } from "@/components/home/home-launch-config";
import { VisualThemeScope } from "@/components/platform-visual/VisualThemeScope";
import type { PlatformVisualConfig } from "@/lib/platform-visual/types";
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

type HomeContentProps = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  latestListings: Product[];
  trendingListings: Product[];
  allListings: ProductsPage;
  liveAuctions: AuctionListing[];
  visualConfig: PlatformVisualConfig;
  loadError?: {
    featured?: boolean;
    recommended?: boolean;
    newListings?: boolean;
    latestListings?: boolean;
    trendingListings?: boolean;
    auctions?: boolean;
    allListings?: boolean;
  };
};

export const HomeContent = memo(function HomeContent({
  featured,
  recommended,
  newListings,
  latestListings,
  trendingListings,
  allListings,
  liveAuctions,
  visualConfig,
  loadError = {},
}: HomeContentProps) {
  const categoryRail = visualConfig.homepageBuilder.components.find((item) => item.id === "category-rail");

  return (
    <VisualThemeScope theme={visualConfig.theme} mode={visualConfig.mode}>
      <main
        className={cn(
          "rx-home-polish rx-home-final flex w-full flex-col pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))]",
        )}
      >
        <section
          className="rx-visual-section rx-home-category-only"
          data-component-id="category-rail"
          aria-label="Categories"
        >
          <HomeCategoryRail
            iconSize={categoryRail?.style.iconSize ?? 80}
            gap={categoryRail?.style.gap ?? 12}
          />
        </section>

        <section className="rx-visual-section" data-component-id="bring-items">
          <BringYourItemsBanner />
        </section>

        <section className="rx-visual-section" data-component-id="popular-auctions">
          <LiveAuctionsSection auctions={liveAuctions} loadError={loadError?.auctions} />
        </section>

        <section className="rx-visual-section" data-component-id="featured-listings">
          <FeaturedListingsSection products={featured} error={loadError?.featured} />
        </section>

        <section className="rx-visual-section" data-component-id="recommended">
          <HomeProductSection
            id="recommended-for-you-heading"
            title="Recommended"
            products={recommended}
            error={loadError?.recommended}
            hideWhenEmpty
            viewAllHref={HOME_LAUNCH_VIEW_ALL_HREFS.recommended}
          />
        </section>

        <section className="rx-visual-section" data-component-id="new-listings">
          <HomeProductSection
            id="new-listings-heading"
            title="New Listings"
            products={newListings}
            error={loadError?.newListings}
            hideWhenEmpty
            viewAllHref={HOME_LAUNCH_VIEW_ALL_HREFS.newListings}
          />
        </section>

        <section className="rx-visual-section" data-component-id="latest-listings">
          <HomeProductSection
            id="latest-listings-heading"
            title="Latest Listings"
            products={latestListings}
            error={loadError?.latestListings}
            hideWhenEmpty
            viewAllHref={HOME_LAUNCH_VIEW_ALL_HREFS.latestListings}
          />
        </section>

        <section className="rx-visual-section" data-component-id="trending-listings">
          <HomeTrendingListingsSection
            products={trendingListings}
            error={loadError?.trendingListings}
          />
        </section>

        <section className="rx-visual-section" data-component-id="all-listings">
          <HomeAllListingsSection initialPage={allListings} />
        </section>
      </main>
    </VisualThemeScope>
  );
});
