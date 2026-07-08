"use client";

import { memo, useMemo } from "react";
import type { HomepageV4Sections } from "@/lib/homepage/v4-data";
import { HomepageV4CategoryRail } from "@/components/homepage-v4/HomepageV4CategoryRail";
import { HomepageV4BringYourItem } from "@/components/homepage-v4/HomepageV4BringYourItem";
import { StoresSection } from "@/components/home/stores/StoresSection";
import { HomepageV4Feed } from "@/components/homepage-v4/HomepageV4Feed";

export type HomepageV4Props = HomepageV4Sections;

export const HomepageV4 = memo(function HomepageV4({
  showcases,
  featured,
  feed,
}: HomepageV4Props) {
  const showcase = showcases[0] ?? null;
  const reservedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const product of featured) ids.add(product.id);
    if (showcase) {
      for (const product of showcase.listings) ids.add(product.id);
    }
    return [...ids];
  }, [featured, showcase]);

  return (
    <main className="rx4" data-homepage-version="mobile-v1.0">
      <HomepageV4CategoryRail />
      <HomepageV4BringYourItem />
      <StoresSection section={showcase} />
      <HomepageV4Feed initialPage={feed} reservedIds={reservedIds} />
    </main>
  );
});
