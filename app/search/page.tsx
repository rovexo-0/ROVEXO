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
      path: `/search?q=${encodeURIComponent(q.trim())}`,
      noIndex: true,
    });
  }
  if (category?.trim()) {
    return buildPageMetadata({
      title: `Browse ${category.trim()}`,
      description: `Browse ${category.trim()} on ROVEXO.`,
      path: `/search?category=${encodeURIComponent(category.trim())}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: "Search",
    description: "Search products on ROVEXO.",
    path: "/search",
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { visual } = await searchParams;

  if (visual === "1") {
    redirect(CAMERA_SEARCH_V1.resultsRoute);
  }

  return (
    <BetaAppShell bottomNavTab="search">
      <HubPageMain className="gap-0 px-0 py-0">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <SearchResultsView />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
