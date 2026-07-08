"use client";

import { memo } from "react";
import type { HomepageV3Sections } from "@/lib/homepage/v3-data";
import { HomepageV3Search } from "@/components/homepage-v3/HomepageV3Search";
import { HomepageV3CategoryRail } from "@/components/homepage-v3/HomepageV3CategoryRail";
import { HomepageV3BringYourItem } from "@/components/homepage-v3/HomepageV3BringYourItem";
import { HomepageV3Showcase } from "@/components/homepage-v3/HomepageV3Showcase";
import { HomepageV3ListingRail } from "@/components/homepage-v3/HomepageV3ListingRail";
import { HomepageV3Feed } from "@/components/homepage-v3/HomepageV3Feed";
import { HP3_VIEW_ALL } from "@/components/homepage-v3/constants";

export type HomepageV3Props = HomepageV3Sections;

export const HomepageV3 = memo(function HomepageV3({
  showcase,
  featured,
  recommended,
  newest,
  boosted,
  feed,
}: HomepageV3Props) {
  return (
    <main className="hp3">
      <HomepageV3Search />
      <HomepageV3CategoryRail />
      <HomepageV3BringYourItem />
      <HomepageV3Showcase sections={showcase} />
      <HomepageV3ListingRail
        id="hp3-featured"
        title="Featured"
        products={featured}
        viewAllHref={HP3_VIEW_ALL.featured}
        statusBadgeLabel="Featured"
        showStatusBadge
      />
      <HomepageV3ListingRail
        id="hp3-recommended"
        title="Recommended"
        products={recommended}
        viewAllHref={HP3_VIEW_ALL.recommended}
      />
      <HomepageV3ListingRail
        id="hp3-newest"
        title="Newest"
        products={newest}
        viewAllHref={HP3_VIEW_ALL.newest}
        statusBadgeLabel="New"
        showStatusBadge
      />
      <HomepageV3ListingRail
        id="hp3-boosted"
        title="Boosted"
        products={boosted}
        viewAllHref={HP3_VIEW_ALL.boosted}
        statusBadgeLabel="Boost"
        showStatusBadge
      />
      <HomepageV3Feed initialPage={feed} />
    </main>
  );
});
