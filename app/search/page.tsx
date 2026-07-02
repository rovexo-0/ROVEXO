import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { SearchLandingClient } from "@/features/search/components/SearchLandingClient";
import { SearchResultsView } from "@/features/search/components/SearchResultsView";
import { SearchEngineHub } from "@/features/search-engine/SearchEngineHub";
import { SEARCH_ENGINE_MODULES } from "@/lib/search-engine/registry";
import {
  getPublicSearchEngineConfig,
  getSearchEngineAnalytics,
  getSearchEngineContext,
} from "@/lib/search-engine/reader";
import { buildPageMetadata } from "@/lib/seo/metadata";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  if (q?.trim()) {
    return buildPageMetadata({
      title: `Search results for “${q.trim()}”`,
      description: `Find ${q.trim()} and more on ROVEXO.`,
      path: `/search?q=${encodeURIComponent(q.trim())}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: "Search",
    description: "Search products, categories, and sellers on ROVEXO.",
    path: "/search",
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const hasQuery = Boolean(q?.trim());

  if (hasQuery) {
    return (
      <BetaAppShell bottomNavTab="search">
        <Header />
        <main className="px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <SearchResultsView />
          </Suspense>
        </main>
      </BetaAppShell>
    );
  }

  const [config, context, analytics] = await Promise.all([
    getPublicSearchEngineConfig(),
    getSearchEngineContext(),
    getSearchEngineAnalytics(),
  ]);

  return (
    <>
      <Header />
      <Suspense fallback={<div className="srch-hub p-ds-5">Loading search…</div>}>
        <SearchEngineHub
          config={config}
          context={context}
          modules={SEARCH_ENGINE_MODULES}
          analytics={analytics}
          landing={<SearchLandingClient />}
        />
      </Suspense>
    </>
  );
}
