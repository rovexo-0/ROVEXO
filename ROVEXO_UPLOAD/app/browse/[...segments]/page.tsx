import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProgrammaticPageView } from "@/features/seo/components/ProgrammaticPageView";
import { searchListings } from "@/lib/listings/repository";
import {
  programmaticPageJsonLd,
  programmaticPageMetadata,
} from "@/lib/seo/programmatic/metadata";
import {
  buildProgrammaticSearchQuery,
  resolveProgrammaticPage,
} from "@/lib/seo/programmatic/resolver";

type BrowsePageProps = {
  params: Promise<{ segments: string[] }>;
};

export async function generateMetadata({ params }: BrowsePageProps): Promise<Metadata> {
  const { segments } = await params;
  const page = resolveProgrammaticPage(segments);
  if (!page) return { title: "Not found · ROVEXO", robots: { index: false, follow: false } };
  return programmaticPageMetadata(page);
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const { segments } = await params;
  const page = resolveProgrammaticPage(segments);
  if (!page) notFound();

  const query = buildProgrammaticSearchQuery(page);
  const results = await searchListings({
    categorySlugPath: query.categorySlugPath,
    brand: query.brand,
    conditions: query.conditions,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    page: 1,
    pageSize: 24,
  });

  const jsonLd = programmaticPageJsonLd(page);

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd.collection, jsonLd.breadcrumbs, jsonLd.faq]),
        }}
      />
      <ProgrammaticPageView page={page} products={results.items} total={results.total} />
    </BetaAppShell>
  );
}
