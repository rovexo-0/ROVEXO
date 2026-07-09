import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SeoLandingPageView } from "@/features/seo/components/SeoLandingPageView";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import {
  discoveryPageJsonLd,
  locationCategoryMetadata,
  resolveLocationCategoryPage,
} from "@/lib/seo/engine";
import { localBrowseLinks, popularBrowseLinks } from "@/lib/seo/internal-links";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo/json-ld";

type LocationCategoryPageProps = {
  params: Promise<{ location: string; category: string[] }>;
};

export async function generateMetadata({ params }: LocationCategoryPageProps): Promise<Metadata> {
  const { location, category } = await params;
  const page = resolveLocationCategoryPage(location, category);
  if (!page) return { title: "Not found · ROVEXO", robots: { index: false, follow: false } };

  const results = await getEligibleListings({
    surface: "category",
    categorySlugPath: page.categorySlugs,
    locationCity: page.locationName,
    pageSize: 1,
  });

  return locationCategoryMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    listingCount: results.total,
    categorySlug: page.categorySlugs[0] ?? "everything-else",
  });
}

export default async function LocationCategoryRoute({ params }: LocationCategoryPageProps) {
  const { location, category } = await params;
  const page = resolveLocationCategoryPage(location, category);
  if (!page) notFound();

  const results = await getEligibleListings({
    surface: "category",
    categorySlugPath: page.categorySlugs,
    locationCity: page.locationName,
    page: 1,
    pageSize: 24,
  });

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: page.locationName, href: `/l/${page.locationSlug}` },
    { name: page.categoryName, href: page.path },
  ];

  const jsonLd = {
    place: localBusinessJsonLd({
      name: page.title,
      locationName: page.locationName,
      path: page.path,
    }),
    breadcrumbs: breadcrumbJsonLd(breadcrumbs),
    itemList: discoveryPageJsonLd(
      {
        kind: "discovery",
        slug: `${page.locationSlug}-${page.categorySlugs.join("-")}`,
        path: page.path,
        title: page.title,
        description: page.description,
        search: { categorySlugPath: page.categorySlugs, locationCity: page.locationName },
        breadcrumbs,
        facetTypes: ["category", "location"],
      },
      results.items,
    ).itemList,
  };

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd.place, jsonLd.breadcrumbs, jsonLd.itemList].filter(Boolean)),
        }}
      />
      <SeoLandingPageView
        title={page.title}
        description={page.description}
        products={results.items}
        total={results.total}
        breadcrumbs={breadcrumbs}
        internalLinkGroups={[
          localBrowseLinks(page.locationSlug, page.locationName),
          popularBrowseLinks(),
        ]}
      />
    </BetaAppShell>
  );
}

export function generateStaticParams() {
  return [];
}
