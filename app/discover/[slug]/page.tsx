import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SeoLandingPageView } from "@/features/seo/components/SeoLandingPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { buildOrganicGrowthContext, discoveryPageLinkGroups, resolveDiscoveryPage } from "@/lib/seo/engine";

type DiscoverPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DiscoverPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = resolveDiscoveryPage(slug);
  if (!page) return { title: "Not found · ROVEXO", robots: { index: false, follow: false } };

  const results = await getEligibleListings({ surface: "search", ...page.search, pageSize: 1 });
  return buildOrganicGrowthContext(page, results.items, results.total).metadata;
}

export default async function DiscoverRoute({ params }: DiscoverPageProps) {
  const { slug } = await params;
  const page = resolveDiscoveryPage(slug);
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
      <Header />
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
        internalLinkGroups={[...discoveryPageLinkGroups(page), ...ctx.internalLinks]}
        faqItems={ctx.faq}
        indexable={ctx.indexable}
      />
    </BetaAppShell>
  );
}
