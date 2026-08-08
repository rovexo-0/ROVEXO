import type { Metadata } from "next";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import "@/styles/rovexo/search-results-v1.css";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchResultsView } from "@/features/search/components/SearchResultsView";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { getTrendingSearches } from "@/lib/search/trending";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; visual?: string; category?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q, visual, category } = await searchParams;
  if (visual === "1") {
    return buildPageMetadata({
      title: "Image Search",
      description: "Results similar to your photo",
      path: CAMERA_SEARCH_V1.resultsRoute,
      noIndex: true,
    });
  }
  if (q?.trim()) {
    return buildPageMetadata({
      title: `Search results for “${q.trim()}”`,
      description: `Find ${q.trim()} and more on ROVEXO.`,
      path: "/search",
      noIndex: true,
    });
  }
  if (category?.trim()) {
    return buildPageMetadata({
      title: `Browse ${category.trim()}`,
      description: `Browse ${category.trim()} on ROVEXO.`,
      path: "/search",
      noIndex: true,
    });
  }
  /* Empty Search landing is the indexable browse surface; query/category/visual stays noIndex. */
  return buildPageMetadata({
    title: "Search",
    description:
      "Search ROVEXO for fashion, electronics, home, and more from verified UK sellers with purchase protection.",
    path: "/search",
    noIndex: false,
  });
}

async function SearchPageBody({
  hasBrowseTarget,
}: {
  hasBrowseTarget: boolean;
}) {
  if (hasBrowseTarget) {
    return <SearchResultsView />;
  }

  let trending: string[] = [];
  try {
    trending = await getTrendingSearches([], 8);
  } catch {
    trending = [];
  }

  /* Idle /search = Global Search only (no Browse Categories grid). */
  return <SearchResultsView categoryCounts={[]} trending={trending} />;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { visual, q, category } = await searchParams;

  if (visual === "1") {
    redirect(CAMERA_SEARCH_V1.resultsRoute);
  }

  const hasBrowseTarget = Boolean(q?.trim()) || Boolean(category?.trim());

  return (
    <BetaAppShell bottomNavTab="search">
      <HubPageMain className="gap-0 px-0 py-0">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <SearchPageBody hasBrowseTarget={hasBrowseTarget} />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
