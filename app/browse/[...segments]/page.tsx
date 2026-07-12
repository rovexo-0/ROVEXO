import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProgrammaticPageView } from "@/features/seo/components/ProgrammaticPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { browsePageMetadata, buildOrganicPageContext } from "@/lib/seo/engine";
import { programmaticPageJsonLd } from "@/lib/seo/programmatic/metadata";
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

  const query = buildProgrammaticSearchQuery(page);
  const results = await getEligibleListings({ surface: "category", ...query, pageSize: 1 });
  return browsePageMetadata(page, results.total);
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const { segments } = await params;
  const page = resolveProgrammaticPage(segments);
  if (!page) notFound();

  const query = buildProgrammaticSearchQuery(page);
  const results = await getEligibleListings({
    surface: "category",
    categorySlugPath: query.categorySlugPath,
    brand: query.brand,
    conditions: query.conditions,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    page: 1,
    pageSize: 24,
  });

  const jsonLd = programmaticPageJsonLd(page);
  const ctx = buildOrganicPageContext(
    {
      kind: "browse",
      slug: segments.join("-"),
      path: page.path,
      title: page.title,
      description: page.description,
      search: query,
      facetTypes: [
        ...(page.brand ? (["brand"] as const) : []),
        ...(page.locationName ? (["location"] as const) : []),
        ...(page.condition ? (["condition"] as const) : []),
        ...(page.priceRange ? (["price"] as const) : []),
        "category",
      ],
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: page.title, href: page.path },
      ],
    },
    results.items,
    results.total,
  );

  return (
    <BetaAppShell bottomNavTab="search">
      <RovexoHeaderV2 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([...Object.values(jsonLd), ...ctx.jsonLd]),
        }}
      />
      <ProgrammaticPageView page={page} products={ctx.products} total={results.total} />
    </BetaAppShell>
  );
}
