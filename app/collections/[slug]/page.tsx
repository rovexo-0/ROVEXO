import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SeoLandingPageView } from "@/features/seo/components/SeoLandingPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { buildOrganicGrowthContext, resolveCollectionPage } from "@/lib/seo/engine";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = resolveCollectionPage(slug);
  if (!page) return { title: "Not found · ROVEXO", robots: { index: false, follow: false } };

  const results = await getEligibleListings({ surface: "search", ...page.search, pageSize: 1 });
  return buildOrganicGrowthContext(page, results.items, results.total).metadata;
}

export default async function CollectionRoute({ params }: CollectionPageProps) {
  const { slug } = await params;
  const page = resolveCollectionPage(slug);
  if (!page) notFound();

  const results = await getEligibleListings({
    surface: "search",
    ...page.search,
    page: 1,
    pageSize: 24,
  });

  const ctx = buildOrganicGrowthContext(page, results.items, results.total);

  return (
    <BetaAppShell bottomNavTab="search">
      <RovexoHeaderV2 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ctx.jsonLd) }}
      />
      <SeoLandingPageView
        title={page.title.replace(/ \| ROVEXO$/, "")}
        description={page.description}
        products={ctx.products}
        total={results.total}
        breadcrumbs={page.breadcrumbs}
        internalLinkGroups={ctx.internalLinks}
        faqItems={ctx.faq}
        indexable={ctx.indexable}
      />
    </BetaAppShell>
  );
}
