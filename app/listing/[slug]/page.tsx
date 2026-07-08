import type { Metadata } from "next";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { incrementProductViews } from "@/lib/listings/repository";
import { fetchProductBySlug, fetchSimilarProducts } from "@/lib/products/queries";
import { getCategoryBreadcrumbsForProduct } from "@/lib/categories/server";
import { productJsonLd } from "@/lib/seo/json-ld";
import { getAppUrl } from "@/lib/supabase/env";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return { title: "Listing not found · ROVEXO" };
  }

  const title = `${product.title} · ROVEXO`;
  const description = product.description.slice(0, 160) || `Buy ${product.title} on ROVEXO.`;
  const canonical = `${getAppUrl()}/listing/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const [product, similarProducts] = await Promise.all([
    fetchProductBySlug(slug),
    fetchSimilarProducts(slug),
  ]);

  if (!product) {
    notFound();
  }

  if (product.listingType === "auction") {
    redirect("/auctions");
  }

  const breadcrumbs = await getCategoryBreadcrumbsForProduct(product.categoryId ?? null);

  // View counting is best-effort and must not block the page render; run it
  // after the response is sent.
  after(() => {
    void incrementProductViews(slug).catch(() => undefined);
  });

  const structuredData = productJsonLd(product, breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailPage product={product} similarProducts={similarProducts} />
    </>
  );
}
