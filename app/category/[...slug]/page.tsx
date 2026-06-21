import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryPageView } from "@/features/categories/components/CategoryPageView";
import { resolveCategoryPage } from "@/lib/categories/server";
import { searchListings } from "@/lib/listings/repository";
import { getAppUrl } from "@/lib/supabase/env";

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category) {
    return { title: "Category not found · ROVEXO" };
  }

  const title = `${category.node.name} · ROVEXO`;
  const description = `Shop ${category.node.name} on ROVEXO. Browse verified sellers and protected checkout.`;
  const canonical = `${getAppUrl()}/category/${slug.join("/")}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: category.imageUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.imageUrl],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await resolveCategoryPage(slug);

  if (!category) {
    notFound();
  }

  const results = await searchListings({
    categoryIds: category.categoryIds.length ? category.categoryIds : undefined,
    categorySlugPath: category.categoryIds.length ? undefined : slug,
    page: 1,
    pageSize: 24,
  });

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <CategoryPageView category={category} products={results.items} total={results.total} />
    </BetaAppShell>
  );
}
