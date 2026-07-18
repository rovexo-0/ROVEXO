import type { Metadata } from "next";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { incrementProductViews } from "@/lib/listings/repository";
import { fetchProductBySlug, fetchSimilarProducts } from "@/lib/products/queries";
import { getCategoryBreadcrumbsForProduct } from "@/lib/categories/server";
import { productPageMetadata } from "@/lib/seo/engine";
import { productJsonLd } from "@/lib/seo/json-ld";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return { title: "Listing not found · ROVEXO", robots: { index: false, follow: false } };
  }

  return productPageMetadata({
    title: product.title,
    description: product.description,
    slug,
    imageUrl: product.images[0],
  });
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
    redirect("/search");
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
