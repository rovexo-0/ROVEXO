"use client";

import { memo, useMemo } from "react";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import type { HomepageV4Sections } from "@/lib/homepage/v4-data";
import { CanonicalCategoryRail } from "@/components/homepage/canonical/CanonicalCategoryRail";
import {
  FeaturedStoreSection,
  selectHomepageFeaturedStore,
} from "@/components/homepage/canonical/featured-store/FeaturedStoreSection";
import { CanonicalMarketplaceFeed } from "@/components/homepage/canonical/CanonicalMarketplaceFeed";
import { HOMEPAGE_SOCIAL_PREVIEW_V2 } from "@/lib/share/homepage";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

export type CanonicalHomepageProps = HomepageV4Sections;

/**
 * ROVEXO Homepage v1.0 (CEO Final Lock).
 * Following feed is NOT mounted here — Follow Engine remains for Profile / dashboards.
 */
export const CanonicalHomepage = memo(function CanonicalHomepage({
  showcases,
  feed,
}: CanonicalHomepageProps) {
  // Reserve ONLY listings shown in a visible showcase section, so they are not
  // duplicated in the main feed. Featured listings have no standalone section
  // in this layout, so they must remain visible in the feed.
  const reservedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of showcases) {
      for (const product of section.listings) ids.add(product.id);
    }
    return [...ids];
  }, [showcases]);

  /* P0-01-A: Showcase owns the single LCP listing when it renders; else feed index 0. */
  const showcaseOwnsLcp = useMemo(
    () => selectHomepageFeaturedStore(showcases) != null,
    [showcases],
  );

  return (
    <ScrollContainer
      id="main-content"
      withBottomNav
      className={css.hpCanonical}
      data-hp-homepage="canonical"
      data-hp-homepage-version="phase-2-refinement-01"
      data-hp-following="removed"
    >
      <h1 className={css.hpH1} data-hp-h1="phase-2">
        {HOMEPAGE_SOCIAL_PREVIEW_V2.title}
      </h1>
      <CanonicalCategoryRail />
      <FeaturedStoreSection sections={showcases} />
      <CanonicalMarketplaceFeed
        initialPage={feed}
        reservedIds={reservedIds}
        lcpImagePriority={!showcaseOwnsLcp}
      />
    </ScrollContainer>
  );
});
