import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SeoLandingPageView } from "@/features/seo/components/SeoLandingPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { buildOrganicGrowthContext, detectTrendSignals, resolveTrendPage } from "@/lib/seo/engine";

type TrendPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TrendPageProps): Promise<Metadata> {
  const { slug } = await params;
  const signals = await detectTrendSignals(50);
  const page = resolveTrendPage(slug, signals);
  if (!page) return { title: "Not found · ROVEXO", robots: { index: false, follow: false } };

  const results = await getEligibleListings({ surface: "search", ...page.search, pageSize: 1 });
  return buildOrganicGrowthContext(page, results.items, results.total).metadata;
}

export default async function TrendRoute({ params }: TrendPageProps) {
  const { slug } = await params;
  const signals = await detectTrendSignals(50);
  const page = resolveTrendPage(slug, signals);
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
        internalLinkGroups={ctx.internalLinks}
        faqItems={ctx.faq}
        indexable={ctx.indexable}
      />
    </BetaAppShell>
  );
}
