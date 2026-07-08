"use client";

import { memo, useMemo } from "react";
import type { HomepageV4Sections } from "@/lib/homepage/v4-data";
import { CanonicalCategoryRail } from "@/components/homepage/canonical/CanonicalCategoryRail";
import { FeaturedStoreSection } from "@/components/homepage/canonical/featured-store/FeaturedStoreSection";
import { CanonicalMarketplaceFeed } from "@/components/homepage/canonical/CanonicalMarketplaceFeed";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

export type CanonicalHomepageProps = HomepageV4Sections;

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

  return (
    <main
      className={css.hpCanonical}
      data-hp-homepage="canonical"
      data-hp-homepage-version="ui-lock-1.0"
    >
      <CanonicalCategoryRail />
      <FeaturedStoreSection sections={showcases} />
      <CanonicalMarketplaceFeed initialPage={feed} reservedIds={reservedIds} />
    </main>
  );
});
