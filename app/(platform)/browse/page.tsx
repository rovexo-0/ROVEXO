import type { Metadata } from "next";
import { Suspense } from "react";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchLandingView } from "@/features/search/components/SearchLandingView";
import { getCanonicalBrowseCategoryCounts } from "@/lib/listings/eligible-listings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getTrendingSearches } from "@/lib/search/trending";
import "@/styles/rovexo/search-results-v1.css";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Browse",
  description: "Browse ROVEXO marketplace categories.",
  path: "/browse",
  noIndex: true,
});

/**
 * Canonical Browse entry (Bottom Navigation).
 * Header Search must never land here — Global Search owns `/search`.
 */
async function BrowsePageBody() {
  let categoryCounts: { slug: string; itemCount: number }[] = [];
  let trending: string[] = [];
  try {
    const [counts, trend] = await Promise.all([
      getCanonicalBrowseCategoryCounts(),
      getTrendingSearches([], 8),
    ]);
    categoryCounts = counts;
    trending = trend;
  } catch {
    categoryCounts = [];
    trending = [];
  }

  return (
    <SearchLandingView
      categoryCounts={categoryCounts}
      trending={trending}
      surface="browse"
    />
  );
}

export default function BrowseLandingPage() {
  return (
    <BetaAppShell bottomNavTab="search">
      <HubPageMain className="gap-0 px-0 py-0">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <BrowsePageBody />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
