import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { incrementProductViews } from "@/lib/listings/repository";
import { fetchProductBySlug, fetchSimilarProducts } from "@/lib/products/queries";
import { isProductSaved } from "@/lib/saved/check";
import { getAuthContext } from "@/lib/auth/session";
import { getCategoryBreadcrumbsForProduct } from "@/lib/categories/server";
import { productJsonLd } from "@/lib/seo/json-ld";
import { getPublicTrustSummary } from "@/lib/trust/service";
import { getAppUrl } from "@/lib/supabase/env";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

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
  const [product, similarProducts, auth] = await Promise.all([
    fetchProductBySlug(slug),
    fetchSimilarProducts(slug),
    getAuthContext(),
  ]);

  if (!product) {
    notFound();
  }

  const [breadcrumbs, initialIsSaved, sellerTrust] = await Promise.all([
    getCategoryBreadcrumbsForProduct(product.categoryId ?? null),
    auth ? isProductSaved(auth.user.id, slug) : Promise.resolve(false),
    getPublicTrustSummary(product.sellerId),
  ]);

  await incrementProductViews(slug);

  const structuredData = productJsonLd(product, breadcrumbs);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailPage
        product={product}
        similarProducts={similarProducts}
        initialIsSaved={initialIsSaved}
        breadcrumbs={breadcrumbs}
        sellerTrust={sellerTrust}
      />
    </div>
  );
}
