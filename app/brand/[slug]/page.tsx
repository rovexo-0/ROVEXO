import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SeoLandingPageView } from "@/features/seo/components/SeoLandingPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import {
  brandPageJsonLd,
  brandPageLinkGroups,
  brandPageMetadata,
  fetchBrandBySlug,
  resolveBrandPage,
} from "@/lib/seo/engine";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);
  const page = resolveBrandPage(slug, brand);
  if (!page) return { title: "Brand not found · ROVEXO", robots: { index: false, follow: false } };

  const results = await getEligibleListings({ surface: "category", brand: brand!.name, pageSize: 1 });
  return brandPageMetadata(page, results.total);
}

export default async function BrandRoute({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);
  const page = resolveBrandPage(slug, brand);
  if (!page) notFound();

  const results = await getEligibleListings({
    surface: "category",
    brand: brand!.name,
    page: 1,
    pageSize: 24,
  });

  const jsonLd = brandPageJsonLd(page, results.items);
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: page.name, href: page.path },
  ];

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd.collection, jsonLd.breadcrumbs, jsonLd.itemList].filter(Boolean)),
        }}
      />
      <SeoLandingPageView
        title={page.name}
        description={page.description}
        products={results.items}
        total={results.total}
        breadcrumbs={breadcrumbs}
        internalLinkGroups={brandPageLinkGroups(page, [])}
      />
    </BetaAppShell>
  );
}
