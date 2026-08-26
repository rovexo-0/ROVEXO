import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryPageView } from "@/features/categories/components/CategoryPageView";
import { resolveDemandBadgeLabels } from "@/lib/demand/demand-engine-resolve-v1";
import { resolveCategoryPage } from "@/lib/categories/server";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildCategoryEligibleListingsOptions,
  getEligibleListings,
} from "@/lib/listings/eligible-listings";
import { breadcrumbJsonLd, categoryJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo/metadata";
import { getCategoryHubEditorial } from "@/lib/seo/category-hub-editorial-v1";
import { MIN_INVENTORY_TO_INDEX } from "@/lib/seo/engine/config";

export const revalidate = 300;

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category || !category.isActive) {
    return buildPageMetadata({
      title: "Category not found",
      description: "This category is not available.",
      path: `/category/${slug.join("/")}`,
      noIndex: true,
      omitCanonical: true,
    });
  }

  const results = await getEligibleListings(
    buildCategoryEligibleListingsOptions({
      slugPath: slug,
      categoryIds: category.categoryIds,
      page: 1,
      pageSize: 1,
    }),
  );

  const title = category.seoTitle?.trim() || `${category.node.name} for Sale UK`;
  const description =
    category.seoDescription?.trim() ||
    `Shop ${category.node.name} on ROVEXO. Browse verified UK sellers with purchase protection and secure checkout.`;

  return buildPageMetadata({
    title,
    description,
    path: `/category/${slug.join("/")}`,
    imageUrl: category.imageUrl,
    noIndex: results.total < MIN_INVENTORY_TO_INDEX,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category || !category.isActive) {
    notFound();
  }

  const results = await getEligibleListings(
    buildCategoryEligibleListingsOptions({
      slugPath: slug,
      categoryIds: category.categoryIds,
      page: 1,
      pageSize: 24,
    }),
  );

  const description =
    category.seoDescription ??
    `Shop ${category.node.name} on ROVEXO. Browse verified UK sellers with purchase protection and secure checkout.`;

  const editorial = getCategoryHubEditorial(slug);
  const jsonLd: unknown[] = [
    categoryJsonLd(category.node.name, slug, description),
    breadcrumbJsonLd([
      { name: "Home", href: "/" },
      ...category.breadcrumbs.map((crumb) => ({ name: crumb.name, href: crumb.href })),
    ]),
  ];
  if (editorial && editorial.faqItems.length >= 3 && results.total >= MIN_INVENTORY_TO_INDEX) {
    jsonLd.push(faqJsonLd(editorial.faqItems));
  }

  const demandBadgeLabels = await resolveDemandBadgeLabels(
    results.items.map((item) => item.id),
  );

  return (
    <BetaAppShell bottomNavTab="search">
      <JsonLdScript id="jsonld-app-(platform)-category----slug-page-tsx" data={jsonLd} />
      <CategoryPageView
        category={category}
        products={results.items}
        total={results.total}
        demandBadgeLabels={demandBadgeLabels}
      />
    </BetaAppShell>
  );
}
