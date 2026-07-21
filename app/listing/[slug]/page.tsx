import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { fetchProductBySlug, fetchSimilarProducts } from "@/lib/products/queries";
import { getCategoryBreadcrumbsForProduct } from "@/lib/categories/server";
import { productPageMetadata } from "@/lib/seo/engine";
import { productJsonLd } from "@/lib/seo/json-ld";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: `${STORE_UNAVAILABLE_COPY.title} · ROVEXO`,
      robots: { index: false, follow: false },
    };
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
    return <StoreUnavailablePage kind="listing" />;
  }

  if (product.listingType === "auction") {
    redirect("/search");
  }

  const breadcrumbs = await getCategoryBreadcrumbsForProduct(product.categoryId ?? null);

  // Views: ONLY RecordProductViewBeacon on product page (1.5s dwell) → POST /api/views
  // Forbidden: server auto-increment / Homepage / Search / Saved / refresh automatic +1

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
