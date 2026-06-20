import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/features/product-detail/ProductDetailPage";
import { incrementProductViews } from "@/lib/listings/repository";
import { fetchProductBySlug, fetchSimilarProducts } from "@/lib/products/queries";
import { isProductSaved } from "@/lib/saved/check";
import { getAuthContext } from "@/lib/auth/session";

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
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

  await incrementProductViews(slug);

  const initialIsSaved = auth ? await isProductSaved(auth.user.id, slug) : false;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <ProductDetailPage
        product={product}
        similarProducts={similarProducts}
        initialIsSaved={initialIsSaved}
      />
    </div>
  );
}
