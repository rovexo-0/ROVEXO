import type { Metadata } from "next";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Suspense } from "react";
import "@/styles/rovexo/header-v2.css";
import "@/styles/rovexo/search-results-v1.css";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchResultsView } from "@/features/search/components/SearchResultsView";
import { ImageSearchView } from "@/features/search/components/ImageSearchView";
import { buildPageMetadata } from "@/lib/seo/metadata";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; visual?: string; category?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q, visual, category } = await searchParams;
  if (visual === "1") {
    return buildPageMetadata({
      title: "Image Search",
      description: "Results similar to your photo",
      path: "/search?visual=1",
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
  const isImageSearch = visual === "1";

  if (isImageSearch) {
    return (
      <BetaAppShell bottomNavTab="search">
        <RovexoHeaderV2 />
        <HubPageMain className="rx-image-search-page px-0 py-0">
          <ImageSearchView />
        </HubPageMain>
      </BetaAppShell>
    );
  }

  return (
    <BetaAppShell bottomNavTab="search">
      <RovexoHeaderV2 />
      <HubPageMain className="px-0 py-ds-4">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <SearchResultsView />
        </Suspense>
      </HubPageMain>
    </BetaAppShell>
  );
}
