import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryPageView } from "@/features/categories/components/CategoryPageView";
import { resolveCategoryPage } from "@/lib/categories/server";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { breadcrumbJsonLd, categoryJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const title = category.seoTitle ?? `${category.node.name} for Sale UK`;
  const description =
    category.seoDescription ??
    `Shop ${category.node.name} on ROVEXO. Browse verified UK sellers with purchase protection and secure checkout.`;

  return buildPageMetadata({
    title,
    description,
    path: `/category/${slug.join("/")}`,
    imageUrl: category.imageUrl,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category || !category.isActive) {
    notFound();
  }

  const results = await getEligibleListings({
    surface: "category",
    categoryIds: category.categoryIds.length ? category.categoryIds : undefined,
    categorySlugPath: category.categoryIds.length ? undefined : slug,
    page: 1,
    pageSize: 24,
  });

  const description =
    category.seoDescription ??
    `Shop ${category.node.name} on ROVEXO. Browse verified UK sellers with purchase protection and secure checkout.`;

  return (
    <BetaAppShell bottomNavTab="search">
      <RovexoHeaderV2 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            categoryJsonLd(category.node.name, slug, description),
            breadcrumbJsonLd([
              { name: "Home", href: "/" },
              ...category.breadcrumbs.map((crumb) => ({ name: crumb.name, href: crumb.href })),
            ]),
          ]),
        }}
      />
      <CategoryPageView category={category} products={results.items} total={results.total} />
    </BetaAppShell>
  );
}
