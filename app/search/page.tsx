import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SearchResultsView } from "@/features/search/components/SearchResultsView";
import { SearchLandingClient } from "@/features/search/components/SearchLandingClient";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  if (q?.trim()) {
    return {
      title: `Search “${q.trim()}” · ROVEXO`,
      description: `Find ${q.trim()} and more on ROVEXO.`,
    };
  }
  return {
    title: "Search · ROVEXO",
    description: "Search products, categories, and sellers on ROVEXO.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const hasQuery = Boolean(q?.trim());

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <main className="px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        {hasQuery ? (
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <SearchResultsView />
          </Suspense>
        ) : (
          <SearchLandingClient />
        )}
      </main>
    </BetaAppShell>
  );
}
